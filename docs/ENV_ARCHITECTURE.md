# Environment & Configuration Architecture

## 1. Core Philosophy: "The Type-Safe Waterfall"

We reject the practice of checking `.env` files into Git or managing secrets via scattered dashboard UIs (e.g., Vercel/Netlify dashboards). Instead, we use a strict **Waterfall Model**:

1.  **Source of Truth:** **AWS SSM Parameter Store**. All secrets originate here.
2.  **Runtime Injection (Backend):** AWS ECS injects secrets into containers at startup.
3.  **Runtime Injection (Frontend):** We use a custom "Window Injection" pattern to allow Docker images to be environment-agnostic.
4.  **Local Emulation:** We use **Cascading Overrides** (`dotenv-cli`) to simulate environments locally.
5.  **Code Access:** All variables are accessed via a **Typed Zod Validator** (`@repo/config/env`). Direct usage of `process.env` in application code is **forbidden**.

### 1.1 Environment Matrix

| Environment     | NODE_ENV      | APP_ENV      | Goal                                     |
| :-------------- | :------------ | :----------- | :--------------------------------------- |
| **Local**       | `development` | `local`      | Hot Reloading, Detailed Errors.          |
| **CI / Test**   | `test`        | `test`       | Mocking, Fast execution.                 |
| **AWS Dev**     | `production`  | `dev`        | Optimized Build, connects to Dev DB.     |
| **AWS Staging** | `production`  | `staging`    | Optimized Build, connects to Staging DB. |
| **AWS Prod**    | `production`  | `production` | Optimized Build, connects to Prod DB.    |

---

## 2. The Data Flow

### 2.1 Server-Side (Node.js/Bun)

Secrets travel from AWS Storage to the Process Environment.

1.  **Storage:** Secrets stored in SSM: `/documesh/prod/DATABASE_URL`.
2.  **Infrastructure:** Terraform references the ARN (Pointer).
3.  **Deployment:** AWS ECS Agent fetches value -> Sets `process.env.DATABASE_URL`.
4.  **Application:** `@repo/config/env.ts` validates `process.env` -> Exports typed object.

### 2.2 Client-Side (Browser)

Secrets stay on the server. Public config travels to the `window` object.

1.  **Build Time:** `next build` runs with **placeholder** public variables.
2.  **Runtime:** Server Component reads real `process.env`.
3.  **Injection:** A `<script>` tag writes values to `window.__ENV`.
4.  **Hydration:** React components read from `window.__ENV`.

---

## 3. Implementation Details

### 3.1 The Central Validator (`packages/config/src/env.ts`)

This file is the gatekeeper. It runs on import.

```typescript
import { z } from "zod";

// 1. Server Schema (Secrets - Never exposed to browser)
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z
    .enum(["local", "test", "dev", "staging", "production"])
    .default("local"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  AWS_REGION: z.string().default("us-east-1"),
  // Optional AWS Keys (Required only for LocalStack/Local Dev)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

// 2. Client Schema (Public - Exposed to browser)
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
});

// 3. Runtime Logic
const isBuild =
  process.env.npm_lifecycle_event === "build" ||
  !!process.env.SKIP_ENV_VALIDATION;
const runtimeEnv = {
  NODE_ENV: process.env.NODE_ENV,
  APP_ENV: process.env.APP_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  // ... map all process.env variables here manually ...
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};

let env: z.infer<typeof serverSchema & typeof clientSchema>;

if (isBuild) {
  // Prevent crash during 'bun build' when secrets are missing
  env = process.env as any;
} else {
  const parsed = serverSchema.merge(clientSchema).safeParse(runtimeEnv);
  if (!parsed.success) {
    console.error("❌ Invalid Env Vars:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  env = parsed.data;
}

export { env };
```

### 3.2 The Frontend Injector (No Libraries)

We implemented a lightweight, dependency-free solution to handle Docker environment switching.

**Provider: `apps/web/components/public-env-provider.tsx`**

```tsx
import { env } from "@repo/config/env";

export function PublicEnvProvider() {
  const publicEnv = {
    NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  };
  return (
    <script
      id="public-env"
      dangerouslySetInnerHTML={{
        __html: `window.__ENV = ${JSON.stringify(publicEnv)};`,
      }}
    />
  );
}
```

**Accessor: `apps/web/lib/client-env.ts`**

```typescript
"use client";
export function getClientEnv(key: string) {
  if (typeof window === "undefined") return process.env[key];
  return (window as any).__ENV?.[key] || process.env[key];
}
```

---

## 4. Workflows

### 4.1 Development (Cascading Overrides)

We use `dotenv-cli` to layer configuration files. This allows context switching without editing files.

| Command                   | Configuration Loaded    | Data Source                          |
| :------------------------ | :---------------------- | :----------------------------------- |
| **`bun run dev`**         | `.env`                  | **Localhost** (Docker Compose DB)    |
| **`bun run dev:dev`**     | `.env` + `.env.dev`     | **Remote Dev** (AWS RDS via VPN)     |
| **`bun run dev:staging`** | `.env` + `.env.staging` | **Remote Staging** (AWS RDS via VPN) |

**File Locations:**

- **Root:** `.env` (Shared Infrastructure: DB, Redis, AWS)
- **Apps:** `apps/*/.env` (App-specific overrides, though Root is preferred for shared services)
- **Overrides:** `apps/web/.env.dev` (Gitignored overrides for remote environments)

### 4.2 Syncing Secrets

When a developer needs the latest keys from AWS:

```bash
# Fetches from SSM and writes to apps/web/.env.dev and apps/api/.env.dev
./infrastructure/scripts/sync-env.sh dev
```

---

## 5. Security Rules

1.  **Usage Prohibition:** Never use `process.env.API_KEY` in feature code. Import `env` from `@repo/config`.
2.  **Git Hygiene:** `.env` files are strictly gitignored. Only `.env.example` is committed.
3.  **Naming:**
    - **Server Secrets:** `UPPER_CASE` (e.g., `DATABASE_URL`).
    - **Public:** `NEXT_PUBLIC_UPPER_CASE`.
4.  **Client Isolation:** Do not import `@repo/config/env` into Client Components (`"use client"`). It contains server secrets. Use `getClientEnv()` helper instead.
