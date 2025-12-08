# Code Patterns & Standards

## Database Types

We use a centralized approach for database types to ensure consistency across the monorepo.

### 1. The `types.ts` File

All database entity types are defined in `packages/database/types.ts`. This file exports TypeScript interfaces derived directly from the Drizzle schema using `InferSelectModel` and `InferInsertModel`.

**Location:** `packages/database/types.ts`

**Pattern:**

```typescript
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import * as schema from "./schema";

// Entity Type (Select)
export type User = InferSelectModel<typeof schema.users>;

// Insert Type (Insert)
export type NewUser = InferInsertModel<typeof schema.users>;
```

### 2. Usage in Packages

Any package (Web, Worker, Core) should import types from `@repo/database`.

**Pattern:**

```typescript
import { type User, type Submission } from "@repo/database";

function processUser(user: User) {
  // ...
}
```

### 3. Separation of Concerns

- **`schema.ts`**: Defines the Database Table Structure (SQL columns).
- **`schemas.ts`**: Defines Zod Schemas for runtime validation.
- **`types.ts`**: Defines TypeScript Interfaces for static analysis.

### 4. Inline Documentation (Single Source of Truth)

The `schema.ts` file acts as the **Single Source of Truth** for data definitions. It must be self-documenting.

**Rule:**

- Every Table must have a JSDoc block explaining its purpose.
- Every Non-Trivial Field (e.g., JSONB, Enums, Auth Tokens) must have a JSDoc block explaining its usage, constraints, or business context.

**Pattern:**

```typescript
/**
 * Submissions Table
 * The core unit of work. Represents a document uploaded for processing.
 */
export const submissions = pgTable("submissions", {
  // ...
  /**
   * The Discriminator.
   * Determines which Pipeline to execute (e.g., 'RESUME', 'INVOICE').
   */
  documentType: text("document_type").notNull(),
});
```

## Server Action DTO Pattern

We use a strict DTO (Data Transfer Object) pattern for Next.js Server Actions to handle serialization safely.

### The Problem

Next.js Server Actions cannot return `Date` objects directly to the client (they arrive as strings or cause warnings).

### The Solution: `Public[Entity]`

We define a separate Zod schema in `lib/types.ts` that automatically transforms database entities into client-safe types.

**1. Define Codec & Schema (`apps/web/lib/types.ts`)**
Use `z.codec()` to handle Date <-> ISO String conversion.

```typescript
import { SelectSubmissionSchema } from "@repo/database";
import { z } from "zod";

// Codec: Date <-> ISO String
const DateIsoCodec = z.codec(z.date(), z.string(), {
  decode: (date) => date.toISOString(), // Server -> Client
  encode: (iso) => new Date(iso), // Client -> Server
});

// Extend DB Schema
export const PublicSubmissionSchema = SelectSubmissionSchema.extend({
  createdAt: DateIsoCodec,
  hasData: z.boolean().optional(),
});

export type PublicSubmission = z.infer<typeof PublicSubmissionSchema>;
```

**2. Implement Action (`apps/web/actions/*.ts`)**
Use `.parse()` to auto-transform data before returning.

```typescript
"use server";
import { PublicSubmissionSchema, type PublicSubmission } from "@/lib/types";

export async function getSubmission(
  id: string
): Promise<PublicSubmission | null> {
  const data = await SubmissionService.findById(id);
  if (!data) return null;

  // Auto-Transform
  return PublicSubmissionSchema.parse({
    ...data,
    hasData: !!data.finalData,
  });
}
```

**3. Consume in UI (`apps/web/app/**/\*.tsx`)**
Import the `Public` type.

```tsx
import { type PublicSubmission } from "@/lib/types";
```

## Repository Pattern

We use the Repository pattern to abstract database access.

- **Location:** `packages/core/src/repositories/*.repo.ts`
- **Role:** The ONLY place `drizzle-orm` is imported.

## Service Pattern

We use the Service pattern to encapsulate business logic.

- **Location:** `packages/core/src/services/*.service.ts`
- **Role:** Orchestrates Repositories, Validates Zod Schemas, Handles Errors.
