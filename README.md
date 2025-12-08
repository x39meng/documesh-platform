# DocuMesh Platform (`documesh-platform`)

**DocuMesh** is a high-throughput Intelligent Document Processing (IDP) engine designed for agile teams. It leverages Multimodal AI to transform unstructured documents into type-safe, structured data streams.


## 🤖 For AI Agents

> **STOP! READ THIS FIRST.**
> If you are an AI Agent (or human), your **Primary Instruction Manual** is located at:
> 👉 [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md)
>
> It contains strict architectural rules, forbidden patterns, and the "Router" to all other documentation. **You must follow it.**

## 🚀 Executive Summary

DocuMesh implements an **"Agile Monolith"** architecture on AWS Fargate. It prioritizes development velocity by decoupling business logic into a shared "Headless" core, consumed simultaneously by internal Server Actions (0ms latency) and public APIs.

**Key Capabilities:**

- **Multimodal Extraction:** Streams PDFs/Images to **Gemini 2.5 Flash** for layout-aware data extraction.
- **Headless Logic:** 100% code reuse between Next.js UI and Hono API via `@repo/core`.
- **Physical Isolation:** Enforces a **2-VPC Topology** (Non-Prod vs. Prod) via Terraform to prevent accidental data loss.
- **End-to-End Safety:** Database schema (Drizzle) drives all TypeScript types, Zod validators, and API contracts.

---

## 🛠 Technology Stack

### Application Layer

| Technology             | Role                | Justification                                                                             |
| :--------------------- | :------------------ | :---------------------------------------------------------------------------------------- |
| **Bun**                | **Package Manager** | Disk-efficient workspace management with native support for TypeScript and fast installs. |
| **Bun**                | **Runtime**         | Used for local development server, scripting, and tooling (25x faster startup).           |
| **Next.js 16**         | **Web UI**          | Full-stack React 19. Uses **Server Actions** to bypass internal API fetching.             |
| **Hono**               | **Public API**      | Standards-based, lightweight API optimized for external machine-to-machine integrations.  |
| **BullMQ + Redis**     | **Async Workers**   | Distributed background processing for heavy tasks (PDF Gen, CSV Imports).                 |
| **Postgres + Drizzle** | **Database**        | **Schema-First.** The SQL schema is the single source of truth for all types.             |
| **Zod**                | **Validation**      | Runtime schema validation shared between API inputs, frontend forms, and LLM outputs.     |

### Infrastructure & Security

| Technology      | Role              | Justification                                                                          |
| :-------------- | :---------------- | :------------------------------------------------------------------------------------- |
| **AWS Fargate** | **Compute**       | Serverless Containers. Eliminates OS patching and server management.                   |
| **Terraform**   | **IaC**           | Declarative infrastructure using official AWS modules. Enforces 2-VPC topology.        |
| **AWS SSM**     | **Secrets**       | Centralized Parameter Store. Secrets are injected at runtime, never baked into images. |
| **AWS WAF**     | **Edge Security** | IP Allowlisting for Admin Console; Bot Control for Public App.                         |
| **Tailscale**   | **VPN**           | Subnet Routers allow secure local access to private RDS instances without SSH keys.    |

### Observability & Operations

| Technology       | Role               | Justification                                                                             |
| :--------------- | :----------------- | :---------------------------------------------------------------------------------------- |
| **Axiom**        | **Logs & Traces**  | **100% Sampling.** Ingests all OpenTelemetry traces and structured logs for full history. |
| **Pino**         | **Logger**         | High-performance JSON logger. Automatically injects `trace_id` for correlation.           |
| **Sentry**       | **Error Tracking** | Alerts on crashes only. Middleware injects User/Tenant context.                           |
| **Sentry Crons** | **Monitoring**     | "Dead Man's Switch" for background jobs. Alerts if a worker stalls.                       |
| **Changesets**   | **Versioning**     | Monorepo-native semantic versioning and changelog generation.                             |
| **dotenv-cli**   | **Config**         | Manages cascading environment overrides (`.env` vs `.env.dev`) locally.                   |

---

## 🏗 System Architecture

### 1\. The "Headless Logic" Pattern

We strictly decouple **Business Logic** from **Transport Layers**.

- **Location:** `packages/core`
- **Concept:** Business rules are pure functions. They do not know if they are being called by an HTTP Request (Hono) or a Form Submission (Next.js).
- **Benefit:** Zero code duplication. Refactoring the core updates both the API and the Web Dashboard instantly.

### 2\. The Agile Monolith

We deploy logical microservices as a physical monolith to reduce "Ops Tax."

- **Shared Infrastructure:** One ALB and one ECS Cluster handle traffic for Web, API, and Admin.
- **Routing:** Traffic is routed to the correct container based on **Host Headers** (`api.documesh.com` vs `app.documesh.com`).

### 3\. Type-Safe Configuration

We reject `process.env` usage in application code.

- **Validator:** `packages/config/src/env.ts` validates all environment variables using Zod at startup.
- **Fail Fast:** The app crashes immediately if a required secret is missing, rather than failing silently at runtime.

---

## ⚡ Quick Start

**Prerequisites:** Bun v1.3+, Docker, AWS CLI.

### 1\. Bootstrap

```bash
# Install dependencies
bun install

# Start Local Infrastructure (Postgres, Redis, LocalStack)
docker-compose up -d

# Push Database Schema
bun run db:push

# Seed Database with Test Data
bun run db:seed

# Setup Local S3 (LocalStack)
bun run s3:setup
```

### 2\. Development

We use cascading overrides to switch contexts.

```bash
# Run Local (Connects to Local Docker DB)
bun run dev

# Run Remote Debug (Connects to AWS Dev RDS via Tailscale)
bun run dev:dev

# Start Queue Monitoring Dashboard (Optional)
bun run --filter worker queue:board
# Then open: http://localhost:3002/queues
```

> **👉 See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for detailed login credentials and testing instructions.**
> **📊 See [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) for logging and monitoring setup.**

---

## 📂 Repository Structure

```text
/root
├── apps
│   ├── web             # [Delivery] Next.js Dashboard (Server Actions)
│   ├── api             # [Delivery] Hono API (External Access)
│   └── worker          # [Delivery] BullMQ Consumer (AI Processing)
├── packages
│   ├── core            # [Logic] The Nexus: Zod, Services, Repositories
│   ├── database        # [Data] Drizzle Schema & Migrations
│   ├── ui              # [UI] Shadcn/UI Components & Tailwind Config
│   ├── config          # [Config] Zod Env Validator & Constants
│   ├── eslint-config   # [Tooling] Shared ESLint Rules
│   └── tsconfig        # [Tooling] Shared TypeScript Configs
├── infrastructure
│   ├── scripts         # [Ops] Sync Env & Setup Scripts
│   └── localstack      # [Ops] Local AWS Emulation Config
└── .github             # [CI/CD] Bun Shell Pipelines
```
