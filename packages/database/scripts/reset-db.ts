import { db } from "@/index";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

async function reset() {
  logger.info("Dropping submissions table...");
  await db.execute(sql`DROP TABLE IF EXISTS submissions CASCADE`);
  logger.info("Dropped submissions table");
  process.exit(0);
}

reset().catch((err) => {
  logger.error({ error: err }, "Reset failed");
  process.exit(1);
});
