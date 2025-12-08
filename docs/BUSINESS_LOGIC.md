# Business Logic & IDP Pipeline

**Scope:** Data Models, Extraction Pipelines, and AI Integration.

## 1. The "Headless Logic" Architecture

Business rules are decoupled from the transport layer. Logic exists as pure functions in `packages/core`.

**Example: `createUser`**

- **Input:** Typed DTO (Zod).
- **Output:** Database Record.
- **Consumers:**
  1.  **Next.js:** Calls `createUser` via Server Action (Internal).
  2.  **Hono:** Calls `createUser` via Route Handler (External).

---

## 2. The Polymorphic IDP Pipeline

The core value of DocuMesh is the high-throughput extraction pipeline. We support multiple document types (Resumes, Invoices) via a **Polymorphic Pipeline Registry**.

### Phase 1: Ingestion (High Velocity)

- **Method:** Direct-to-S3 Uploads via Presigned URLs.
- **Benefit:** Bypasses application server bandwidth. Handles spikes of 10k+ files.
- **Trigger:** S3 Event or API Call enqueues job to **BullMQ**.

### Phase 2: Processing (The Worker)

The worker acts as a dynamic router based on the document type. It does not hardcode logic but uses a Registry.

#### 2.1 The Registry (`packages/core/src/pipelines/index.ts`)

We define **Pipelines** as configuration objects binding a Zod Schema to a System Prompt.

```typescript
export const PIPELINES = {
  RESUME: {
    v1: {
      type: "RESUME",
      schema: ResumeSchemaV1,
      model: "gemini-2.5-flash",
      systemPrompt: "You are an expert technical recruiter...",
    },
  },
  INVOICE: {
    v1: {
      type: "INVOICE",
      schema: InvoiceSchemaV1,
      model: "gemini-2.5-flash",
      systemPrompt: "You are a forensic accountant...",
    },
  },
} as const;
```

#### 2.2 Execution Logic

1.  **Job Payload:** `{ fileKey: "...", documentType: "RESUME", pipelineVersion: "v1" }`
2.  **Lookup:** Worker retrieves `PIPELINES["RESUME"]["v1"]`.
3.  **Streaming Analysis:** The PDF is streamed from S3 to **Gemini 2.5 Flash**.
4.  **Validation:** Gemini output is parsed against `pipeline.schema` (Zod).
    - _Success:_ Data saved to `finalData`. Status `completed`.
    - _Failure:_ Data saved to `rawExtraction`. Status `needs_review`.

### Phase 3: Human-in-the-Loop (HITL)

- **UI:** Next.js Dashboard renders a "Review Mode" (PDF Left, Form Right).
- **Logic:** Users correct low-confidence fields.
- **Feedback:** Corrections are stored to fine-tune future prompts (Active Learning).

---

## 3. Prompt Engineering Strategy

We use **Gemini 2.5 Flash** (Multimodal) to "read" documents visually.

### 3.1 The "Visual Anchor" Prompt Pattern

We explicitly instruct the model to look at layout features, not just text.

**System Prompt Example (Resume):**

```text
You are an expert technical recruiter. Analyze this resume PDF.

VISUAL ANALYSIS TASKS:
1. Look for a profile picture. Set 'visual_meta.has_headshot' accordingly.
2. Analyze the layout. Is it a dense academic CV or a modern 2-column design?

EXTRACTION TASKS:
1. Extract candidate profile, work experience, and education.
2. Normalize all dates to "YYYY-MM" format.

OUTPUT FORMAT:
Return ONLY valid JSON matching the provided schema.
```

### 3.2 Handling Hallucinations (Zod Guardrails)

We do not trust the LLM. We use **Zod** to enforce strict data integrity _after_ generation.

- **Dates:** Gemini might return "January 2020". Zod transforms this to `2020-01-01`.
- **Math:** For Invoices, Zod validates that `sum(line_items) === total_amount`.

---

## 4. Data Model (Schema-First)

Defined in Drizzle (`packages/database`).

### 4.1 The `Submissions` Table

This table is the Source of Truth for the document lifecycle.

```typescript
// packages/database/schema.ts
export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),

  // 1. The Discriminator: Tells UI which Component to render
  documentType: text("document_type").notNull(), // 'RESUME' | 'INVOICE'

  // 2. The Version Lock: Tells Worker which logic to use
  pipelineVersion: text("pipeline_version").notNull(), // 'v1'

  // 3. The Polymorphic Payload (JSONB)
  // Allows adding new doc types without DB migrations
  finalData: jsonb("final_data"),

  // 4. The Raw Output (For Debugging/Diffing)
  rawExtraction: jsonb("raw_extraction"),

  status: text("status").default("queued"),
});
```

### 4.2 Why JSONB?

- **Scalability:** Adding a new document type is a **Code Change**, not a **Database Migration**.
- **Queryability:** Postgres allows high-performance indexing on JSONB fields.

---

## 5. Extension Guide: Adding a New Document Type

This architecture allows you to add support for **"Commercial Leases"** in 4 steps without touching infrastructure.

1.  **Define Schema:** Create `packages/core/src/schemas/lease.ts` (Zod).
2.  **Define Pipeline:** Add to `PIPELINES` in `packages/core`.
3.  **Update UI:** Create `apps/web/components/viewers/LeaseViewer.tsx`.
4.  **Deploy:** Run `bun run deploy`.
