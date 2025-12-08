import { Queue } from "bullmq";
import { env, APP_CONFIG } from "@repo/config";

// Parse Redis URL to extract host and port
const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
};

export const documentQueue = new Queue(APP_CONFIG.QUEUE_NAME, { connection });
