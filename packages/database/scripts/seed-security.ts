import { db, organizations } from "@/index";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

async function seed() {
  logger.info("Seeding Security Data...");

  // 1. Check if Org exists
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.apiKey, "sk_test_12345"))
    .limit(1);

  let org;
  if (existing.length > 0) {
    org = existing[0];
    logger.info({ name: org.name }, "Org already exists");
  } else {
    // Create Test Organization
    [org] = await db
      .insert(organizations)
      .values({
        name: "Acme Corp",
        apiKey: "sk_test_12345",
        allowedIps: ["127.0.0.1", "::1"], // Allow localhost
      })
      .returning();
    logger.info({ name: org.name, id: org.id }, "Created Org");
  }

  logger.info(
    {
      org: org.name,
      id: org.id,
      apiKey: org.apiKey,
      allowedIps: org.allowedIps,
    },
    "Security Data Ready"
  );

  process.exit(0);
}

seed().catch((err) => {
  logger.error({ error: err }, "Seeding failed");
  process.exit(1);
});
