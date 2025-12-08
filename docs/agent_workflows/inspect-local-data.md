# Database Inspection Tool (Workflow)

**Description:** Allows the agent to query the local PostgreSQL database to verify data state, check side effects of actions, or inspect seed data. Since there is no direct SQL tool available, the agent must perform the following steps to "read" the database.

## Step 1: Generate Inspection Script

Create a file named `apps/web/tmp_agent_db_read.ts`. Use the template below, but modify the "Query Logic" section to fetch the specific data needed for the current task.

```typescript
import {
  db,
  users,
  organizations,
  submissions,
  accounts,
  sessions,
} from "@repo/database";
import { eq, desc, and, or, sql } from "drizzle-orm";
import * as dotenv from "dotenv";
import path from "path";

// --- SETUP ---
const envPath = path.resolve(process.cwd(), "apps/web/.env");
dotenv.config({ path: envPath });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL missing");
    process.exit(1);
  }

  try {
    // --- QUERY LOGIC (Agent: Modify this section) ---
    // Example: Get all users
    // const results = await db.select().from(users);
    // console.log(JSON.stringify(results, null, 2));
    // Example: Get specific submission
    // const results = await db.select().from(submissions).limit(10);
    // console.log(JSON.stringify(results, null, 2));
    // ------------------------------------------------
  } catch (error) {
    console.error("❌ Query failed:", error);
  }
  process.exit(0);
}

main();
```

## Step 2: Execute Script

Run the script using `bun`.

```bash
bun run apps/web/tmp_agent_db_read.ts
```

## Step 3: Read Output

Read the terminal output to understand the database state.

## Step 4: Cleanup

Always remove the temporary script after reading the data.

```bash
rm apps/web/tmp_agent_db_read.ts
```
