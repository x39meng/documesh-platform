# Operations Manual

**Scope:** Deployment, Monitoring, and Versioning.

## 1. CI/CD Pipeline

The pipeline is defined in **TypeScript** using **Bun Shell** (`scripts/pipeline.ts`) to ensure local reproducibility.

**Stages:**

1.  **Quality Gate:** Parallel execution of Lint, Typecheck, and Vitest (Integration).
2.  **Build:** Multistage Docker build. Pushes to ECR with Git SHA tag.
3.  **Infrastructure:** Syncs `packages/config` constants to `terraform.tfvars.json`.
4.  **Deploy:** Runs `terraform apply` to perform a Rolling Update on ECS.

## 2. Environment Strategy

| Env         | Purpose             | Database Strategy               | Deployment Trigger    |
| :---------- | :------------------ | :------------------------------ | :-------------------- |
| **Dev**     | Integration Testing | **Logical DB** (Resets Nightly) | Push to `dev` branch  |
| **Staging** | Production Mirror   | **Logical DB**                  | Push to `main` branch |
| **Prod**    | Live Traffic        | **Dedicated Instance**          | Git Tag Release       |

## 3. Observability (The Power Duo)

- **Axiom (Logs/Traces):**
  - **100% Sampling.** All OpenTelemetry traces are ingested.
  - **Structured Logging:** Pino injects `trace_id` into every log for correlation.
- **Sentry (Errors):**
  - **Exceptions:** Alerts on crashes. Middleware injects `User/Org` context.
  - **Crons:** "Dead Man's Switch" monitors BullMQ repeaters.

## 4. Versioning Strategy

We use **Changesets** for semantic versioning.

- **Workflow:** Developers run `bun changeset` to document intent.
- **Release:** CI aggregates changesets, bumps versions, and generates `CHANGELOG.md`.
- **Promotion:** Production deployments are gated by specific Release Tags.

## 5. Local Access (Tailscale)

Developers connect to private cloud resources without SSH keys.

1.  Log in to Tailscale.
2.  Route is automatically advertised by the VPC Subnet Router (`t3.nano`).
3.  Connect to `10.10.x.x` directly from local terminal.
