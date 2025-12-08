import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { env } from "@repo/config";
import { createLogger } from "@/lib/logger";

const logger = createLogger("setup-s3");

async function setupLocalS3() {
  logger.info(
    {
      useLocalStack: env.USE_LOCALSTACK,
    },
    "Starting S3 CORS setup script"
  );

  if (!env.USE_LOCALSTACK) {
    logger.info("Not using LocalStack, skipping S3 CORS setup.");
    return;
  }

  const bucketName = "documesh-local";
  logger.info({ bucketName }, "Configuring CORS for bucket");

  const corsRules = [
    {
      AllowedHeaders: ["*"],
      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      AllowedOrigins: ["*"], // For development, allow all. In prod, restrict to domain.
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3000,
    },
  ];

  try {
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: corsRules,
      },
    });

    await s3Client.send(command);
    logger.info("Successfully applied CORS configuration to S3 bucket");
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message }, "Failed to apply CORS configuration");
    process.exit(1);
  }
}

setupLocalS3();
