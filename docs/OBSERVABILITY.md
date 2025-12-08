# Observability

## Quick Start

**Start Queue Dashboard:**

```bash
bun run --filter worker queue:board
```

Then open: http://localhost:3002/queues

## Logging

### Import

```typescript
import { createLogger, withSubmissionContext } from "@repo/core";
```

### Usage

```typescript
// Service-level logger
const logger = createLogger("worker");
logger.info("Processing started", { jobId });

// Context logger (auto-includes submissionId in all logs)
const log = withSubmissionContext(submissionId);
log.info("File downloaded", { bytes: 1024 });
log.error("Processing failed", { error: err.message, stack: err.stack });
```

### Log Levels

- **debug**: Development debugging
- **info**: Normal operations
- **warn**: Warnings to review
- **error**: Errors needing attention

### Rules

✅ **Log**: Service events, job milestones, external API calls  
❌ **Never log**: Passwords, API keys, full documents

## Queue Monitoring (Bull Board)

Dashboard shows:

- Active/waiting/completed/failed jobs
- Job data and errors
- Retry failed jobs manually
- Queue throughput and latency

## Code Location

All observability code lives in:

- **Logger**: `packages/core/src/lib/logger.ts`
- **Dashboard**: `apps/worker/src/board.ts`

## Production

For production, ship logs to CloudWatch/Datadog using pino's transport mechanism:

```javascript
// In production env
const logger = pino({
  transport: {
    target: "pino-cloudwatch",
    options: {
      /* cloudwatch config */
    },
  },
});
```
