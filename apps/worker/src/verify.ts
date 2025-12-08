import { getUploadUrl, s3Client, createLogger } from "@repo/core";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { Queue } from "bullmq";
import { submissions, organizations } from "@repo/database";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@repo/config";
import fs from "fs";
import path from "path";

const logger = createLogger("verify");

// Setup DB
const client = postgres(env.DATABASE_URL);
const db = drizzle(client);

// Setup Queue
const redisUrl = new URL(env.REDIS_URL);
const queue = new Queue("document-processing-queue", {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port || "6379"),
  },
});

async function main() {
  const pdfPath = path.join(__dirname, "test.pdf");

  if (!fs.existsSync(pdfPath)) {
    logger.error({ path: pdfPath }, "Please place a valid PDF file at path");
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);

  logger.info("Getting Upload URL...");
  const { key } = await getUploadUrl("test-org", "test.pdf");
  logger.info({ key }, "URL generated");

  logger.info("Uploading file to S3...");
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME || "documesh-local",
      Key: key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    })
  );
  logger.info("Uploaded.");

  logger.info("Creating DB Record...");
  // Create a dummy org first if needed, but we seeded one in Phase 4
  // We'll use the seeded org ID: 78466464-55d8-435b-96fc-412e7c0612df (from logs)
  // Or fetch it dynamically
  const [org] = await db.select().from(organizations).limit(1);

  if (!org) {
    logger.error(
      "No organization found. Run 'bun scripts/seed-security.ts' first."
    );
    process.exit(1);
  }

  const [record] = await db
    .insert(submissions)
    .values({
      fileKey: key,
      status: "pending",
      orgId: org.id,
      documentType: "RESUME", // Defaulting to RESUME for verification
      pipelineVersion: "resume-v1.0.0",
    })
    .returning();
  logger.info({ id: record.id }, "Record created");

  logger.info("Enqueuing Job...");
  await queue.add("document-processing", {
    submissionId: record.id,
    fileKey: key,
  });
  logger.info("Job enqueued.");

  logger.info("Waiting for worker...");
  // Keep process alive briefly to allow job to be picked up if running locally
  await new Promise((r) => setTimeout(r, 2000));
  process.exit(0);
}

main();
