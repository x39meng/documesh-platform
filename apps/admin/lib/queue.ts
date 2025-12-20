import { Queue } from "bullmq";
import { env, APP_CONFIG } from "@repo/config";

// Singleton pattern to prevent too many Redis connections in dev (Hot Reload)
const globalForQueue = globalThis as unknown as {
  documentQueue: Queue | undefined;
};

const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
};

export const documentQueue =
  globalForQueue.documentQueue ??
  new Queue(APP_CONFIG.QUEUE_NAME, { connection });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.documentQueue = documentQueue;
}
