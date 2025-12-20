# Agent & Developer Guide

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

| Task           | Workflow File                                                                                 | Description                                       |
| :------------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **Inspect DB** | [`docs/agent_workflows/inspect-local-data.md`](./agent_workflows/inspect-local-data.md)       | Check local DB state & recent submissions.        |
| **Validate**   | [`docs/agent_workflows/local-auth-validation.md`](./agent_workflows/local-auth-validation.md) | Sign in & validate features end-to-end.           |
| **Release**    | [`docs/agent_workflows/create-release.md`](./agent_workflows/create-release.md)               | Create atomic commits with changesets for release |

---

## ⛔ The Forbidden List (Strict Constraints)

**You must REJECT code that violates these rules:**

1.  **❌ No Logic in Apps:** `apps/web`, `apps/admin`, and `apps/api` are **Dumb Pipes**. Move logic to `@repo/core`.
2.  **❌ No Direct DB Access in Apps:** `apps/*` must NEVER import `drizzle-orm`. Only use `@repo/core` Services.
3.  **❌ No Direct DB Access in Services:** Services must NEVER call `db.select()`. Only use Repositories.
4.  **❌ No Classes:** Use Module Singletons (exported functions/objects).
5.  **❌ No Relative Imports:** Always use package aliases (e.g., `@repo/database/schema`), even internally.
6.  **❌ No Client-Side Secrets:** Never import `@repo/config` in browser code.
7.  **❌ No Raw Dates in Server Actions:** Always use the DTO pattern (`Public[Entity]`) to serialize Dates to Strings.

---

## 🛑 Knowledge Cutoff & Versions

Your internal knowledge cutoff may be outdated.

1.  **Assume Installed Versions are Stable:** If you see packages like `next@16`, `react@19`, or `zod@4`, **assume these are the current production stable versions**. Do NOT assume they are "beta", "canary", or "unstable" simply because they didn't exist when you were trained.
2.  **Trust the Environment:** The project configuration (`package.json`) is the source of truth.
3.  **Verify Online:** If you are unsure about syntax for a version you don't recognize, use search tools to find the latest documentation. Do NOT "downgrade" code to older patterns based on your training data.

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

### 3. `packages/config` (The Config)

- **Intent:** Shared environment variables and configuration constants.
- **Rule:** No sensitive secrets in client bundles.

### 4. `packages/ui` (The Look)

- **Intent:** Dumb, reusable, presentational components.
- **Rule:** No data fetching, no business logic.

### 5. `apps/web` (The Glue)

- **Intent:** Connects Users -> UI -> Core Services.
- **Rule:** Thin Server Actions, Thin Route Handlers.

### 6. `apps/admin` (The Control)

- **Intent:** Internal Admin Dashboard.
- **Rule:** Uses `@repo/core` services.

### 7. `apps/api` (The Interface)

- **Intent:** External REST API (Hono).
- **Rule:** Dumb pipe to `@repo/core`, handles HTTP only.

### 8. `apps/worker` (The Muscle)

- **Intent:** Background processing (BullMQ).
- **Rule:** Uses `@repo/core` for all heavy lifting.

---

## 📝 Workflow Protocol

When implementing a feature, follow this **Execution Order**:

1.  **Read Patterns:** Before writing ANY code, read `docs/PATTERNS.md` to understand strict project standards.
2.  **Define Data:** Update `packages/database` (Schema -> Types).
3.  **Create Access:** Update `packages/core/repositories`.
4.  **Build Logic:** Update `packages/core/services`.
5.  **Connect UI:** Update `apps/web` (Server Actions -> UI).
6.  **Lint & Typecheck:** Run `bun run lint` in the modified package/app to verify type safety. Fix ALL errors.
7.  **Verify & Test:** Validate by signing in (use standard credentials) and testing the User Flow end-to-end. NOT OPTIONAL.
8.  **Log History:** Document changes in `tmp/agent_history/YYYY_MM_DD_<chat_name>.md` using Conventional Commits. Use a **SINGLE** file for the entire conversation session; append new entries to it rather than creating separate files.

---

## 🛠 Environment Cheatsheet

- **Runtime:** `Bun` (Use `bun install`, `bun run dev`).
- **Database:** Postgres (Local via Docker).
- **Queue:** Redis (Local via Docker).
- **AI SDK:** Vercel AI SDK Core (`ai` v5) + `@ai-sdk/google` (Gemini 3.0 Flash Preview).
- **Logs:** Server logs are persisted to `server.log` in the project root. **Warning:** This file can grow very large; be careful when reading it (use `tail` or `grep`).
- **File Access:** If you cannot access a file via standard tools, try `cat <filename>` in the terminal.

---

## 💬 Communication Style

- **Concise:** Report progress in brief, technical terms.
- **Direct:** No fluff. Code first, context second.
- **Maintainable:** Update docs if you change patterns. Don't create clutter.
- **Proactive Documentation:** If you discover a new pattern, undocumented workflow, or critical finding, **PROMPT THE USER** to update the relevant documentation or `AGENT_GUIDE.md`. Do not let knowledge get lost.
- **Focused:** Focus strictly on the assigned task. **NEVER** modify business logic, change SDKs, or refactor critical paths unless explicitly requested by the user. "Improving" code without a request is forbidden.

---

## 📦 Commits & Versioning

This project uses **Changesets** for version management and **Conventional Commits** for messages.

**When working on commits/releases:** Read [`docs/agent_workflows/create-release.md`](./agent_workflows/create-release.md) for the complete workflow.

## ⚡ Quick Workflows

### Search Logs

If the user requests to search logs, find the correct log:

```bash
find . -name "server.log" -type f 2>/dev/null | head -5
```

Then look up in the log, for example:

```bash
tail -100 apps/web/server.log | grep -E "(Stream part received|Agent Step|Chat stream completed)" | tail -20
```

**Note:** Don't read the entire log, just look for the relevant entries.

---

## 🐛 Debugging Tips

### Key Log Fields

All agent logs include these important fields:

- **`requestId`**: Unique ID for each chat request (use to trace a single request through all logs)
- **`conversationId`**: Persistent conversation ID (use to track conversation history)
- **`step`**: Agent execution step number (0-9, helps identify where issues occur)
- **`duration`**: Execution time in milliseconds
- **`orgId`**: Organization ID (all queries are automatically scoped)

### Common Debugging Scenarios

**Trace a specific agent request:**

```bash
# Get the requestId from recent logs
tail -20 apps/web/server.log | grep "requestId"

# Then trace all logs for that request
grep "YOUR_REQUEST_ID" apps/web/server.log
```

**Debug slow queries:**

```bash
tail -100 apps/web/server.log | grep "Slow query detected"
```

**See query transformations:**

```bash
tail -100 apps/web/server.log | grep -E "(Processing database query|Query transformed)"
```

**Check tool execution results:**

```bash
tail -50 apps/web/server.log | grep "Tool Result"
```

**Monitor streaming performance:**

```bash
tail -50 apps/web/server.log | grep -E "(Stream done|timeToFirstChunk)"
```
