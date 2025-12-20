"use server";

import { documentQueue } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { Job } from "bullmq";

export async function getQueueMetrics() {
  const [counts, failed, completed, active, delayed, waiting] =
    await Promise.all([
      documentQueue.getJobCounts(),
      documentQueue.getFailed(),
      documentQueue.getCompleted(),
      documentQueue.getActive(),
      documentQueue.getDelayed(),
      documentQueue.getWaiting(),
    ]);

  // Serialize jobs to simple objects
  const serializeJob = (job: Job) => ({
    id: job.id || "",
    name: job.name,
    data: job.data || {},
    progress: typeof job.progress === "number" ? job.progress : 0,
    failedReason: job.failedReason,
    timestamp: job.timestamp,
    finishedOn: job.finishedOn,
  });

  return {
    counts: counts as {
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      waiting: number;
    },
    jobs: {
      failed: failed.map(serializeJob),
      completed: completed.map(serializeJob),
      active: active.map(serializeJob),
      delayed: delayed.map(serializeJob),
      waiting: waiting.map(serializeJob),
    },
  };
}

export async function retryJob(jobId: string) {
  const job = await documentQueue.getJob(jobId);
  if (job) {
    await job.retry();
    revalidatePath("/queues");
    return { success: true };
  }
  return { success: false, error: "Job not found" };
}

export async function cleanQueue(
  state: "completed" | "wait" | "active" | "delayed" | "failed"
) {
  // Graceful cleaning logic here
  // BullMQ clean method is specific, usually for completed/failed
  if (state === "completed" || state === "failed") {
    await documentQueue.clean(0, 1000, state);
    revalidatePath("/queues");
    return { success: true };
  }
  return { success: false, error: "Cannot clean active states safely" };
}
