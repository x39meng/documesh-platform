import { sql } from "drizzle-orm";
import { db } from "../index";

async function main() {
  console.log(
    "🚀 Starting migration: Convert agent_messages.content to JSONB..."
  );

  try {
    await db.execute(sql`
      ALTER TABLE agent_messages 
      ALTER COLUMN content TYPE jsonb 
      USING jsonb_build_array(
        jsonb_build_object(
          'type', 'text', 
          'text', content
        )
      );
    `);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
