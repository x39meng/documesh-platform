# Agent & Developer Guide (WSL2 + Bun)

**Role:** You are an expert software engineer working on the Documesh Platform.
**Goal:** This document is your **Router**. Use it to navigate the project, understand the rules, and find specific documentation.

---

## 🧭 Documentation Index (The Map)

| Topic              | File                                                  | Description                                          |
| :----------------- | :---------------------------------------------------- | :--------------------------------------------------- |
| **Quick Start**    | [`docs/LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) | How to run the app locally (`bun dev`).              |
| **Architecture**   | [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)           | High-level system design (Web, Worker, DB).          |
| **Patterns**       | [`docs/PATTERNS.md`](./PATTERNS.md)                   | **CRITICAL**. Code standards (Repo, Service, Types). |
| **Business Logic** | [`docs/BUSINESS_LOGIC.md`](./BUSINESS_LOGIC.md)       | IDP Pipeline & Domain Rules.                         |
| **Frontend**       | [`docs/FRONTEND.md`](./FRONTEND.md)                   | UI/UX Standards & Component Rules.                   |
| **Ops**            | [`docs/OPERATIONS.md`](./OPERATIONS.md)               | Deployment & Infrastructure.                         |

---

## 🤖 Agent Workflows (The Tools)

Use these workflows to perform complex tasks reliably.

| Task           | Workflow File                                                                           | Description                                |
| :------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------- |
| **Inspect DB** | [`docs/agent_workflows/inspect-local-data.md`](./agent_workflows/inspect-local-data.md) | Check local DB state & recent submissions. |

---

## ⛔ The Forbidden List (Strict Constraints)

**You must REJECT code that violates these rules:**

1.  **❌ No Logic in Apps:** `apps/web` and `apps/api` are **Dumb Pipes**. Move logic to `@repo/core`.
2.  **❌ No Direct DB Access in Apps:** `apps/*` must NEVER import `drizzle-orm`. Only use `@repo/core` Services.
3.  **❌ No Direct DB Access in Services:** Services must NEVER call `db.select()`. Only use Repositories.
4.  **❌ No Classes:** Use Module Singletons (exported functions/objects).
5.  **❌ No Relative Imports:** Always use package aliases (e.g., `@repo/database/schema`), even internally.
6.  **❌ No Client-Side Secrets:** Never import `@repo/config` in browser code.
7.  **❌ No Raw Dates in Server Actions:** Always use the DTO pattern (`Public[Entity]`) to serialize Dates to Strings.

---

## 🏗 Project Structure & Intent

### 1. `packages/core` (The Brain)

- **Intent:** Contains ALL business logic, database access, and shared utilities.
- **Structure:**
  - `repositories/`: Direct DB access (Drizzle).
  - `services/`: Business logic & orchestration.
  - `lib/`: Shared helpers (LLM, S3).

### 2. `packages/database` (The Data)

- **Intent:** Single source of truth for Data Definitions.
- **Structure:**
  - `schema.ts`: SQL Table Definitions.
  - `schemas.ts`: Zod Validation Schemas.
  - `types.ts`: **TypeScript Interfaces** (Import these!).

### 3. `packages/ui` (The Look)

- **Intent:** Dumb, reusable, presentational components.
- **Rule:** No data fetching, no business logic.

### 4. `apps/web` (The Glue)

- **Intent:** Connects Users -> UI -> Core Services.
- **Rule:** Thin Server Actions, Thin Route Handlers.

### 5. `apps/worker` (The Muscle)

- **Intent:** Background processing (BullMQ).
- **Rule:** Uses `@repo/core` for all heavy lifting.

---

## 📝 Workflow Protocol

When implementing a feature, follow this **Execution Order**:

1.  **Define Data:** Update `packages/database` (Schema -> Types).
2.  **Create Access:** Update `packages/core/repositories`.
3.  **Build Logic:** Update `packages/core/services`.
4.  **Connect UI:** Update `apps/web` (Server Actions -> UI).

---

## 🛠 Environment Cheatsheet

- **Runtime:** `Bun` (Use `bun install`, `bun run dev`).
- **Database:** Postgres (Local via Docker).
- **Queue:** Redis (Local via Docker).
- **AI SDK:** `@google/genai` (Gemini 2.0).
- **File Access:** If you cannot access a file via standard tools, try `cat <filename>` in the terminal.

---

## 💬 Communication Style

- **Concise:** Report progress in brief, technical terms.
- **Direct:** No fluff. Code first, context second.
- **Maintainable:** Update docs if you change patterns. Don't create clutter.
- **Proactive Documentation:** If you discover a new pattern, undocumented workflow, or critical finding, **PROMPT THE USER** to update the relevant documentation or `AGENT_GUIDE.md`. Do not let knowledge get lost.
