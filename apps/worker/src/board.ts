import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import { env } from "@repo/config";
import { createLogger } from "@repo/core";

const logger = createLogger("bull-board");

const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
};

// Create queue instance
const documentQueue = new Queue("document-processing-queue", { connection });

// Setup Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/queues");

createBullBoard({
  queues: [new BullMQAdapter(documentQueue)],
  serverAdapter,
});

const app = express();
app.use("/queues", serverAdapter.getRouter());

const PORT = 3002;
app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      url: `http://localhost:${PORT}/queues`,
    },
    "Bull Board started"
  );
});
