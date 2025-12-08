import { Worker } from "bullmq";
import {
  downloadFile,
  extractStructuredData,
  PIPELINES,
  DocumentType,
  PipelineVersion,
  SubmissionService,
  createLogger,
  withSubmissionContext,
} from "@repo/core";
import { env } from "@repo/config";

const logger = createLogger("worker");

const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || "6379"),
};

logger.info({ redis: redisUrl.hostname }, "Worker started");

new Worker(
  "document-processing-queue",
  async (job) => {
    const { submissionId, fileKey } = job.data;
    const log = withSubmissionContext(submissionId);

    log.info({ fileKey }, "Processing submission");

    try {
      // 1. Fetch Submission to get Document Type
      const submission = await SubmissionService.findById(submissionId);
      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      log.info(
        {
          docType: submission.documentType,
          pipelineVersion: submission.pipelineVersion,
        },
        "Submission fetched"
      );

      // Update status to processing
      await SubmissionService.updateStatus(submissionId, "processing");

      // 2. Download
      const buffer = await downloadFile(fileKey);
      log.info({ bytes: buffer.length }, "File downloaded");

      // 3. Extract Data using Pipeline
      const docType = submission.documentType as DocumentType;
      const pipelineVersion = submission.pipelineVersion as PipelineVersion;

      const pipelineGroup = PIPELINES[docType] as Record<
        string,
        (typeof PIPELINES.RESUME)["resume-v1.0.0"]
      >;
      const pipeline =
        pipelineGroup?.[pipelineVersion] || PIPELINES.RESUME["resume-v1.0.0"];

      log.info(
        {
          type: pipeline.type,
          version: pipelineVersion,
        },
        "Using pipeline"
      );

      // Extract and validate with Zod schema
      const extractedData = (await extractStructuredData(
        buffer,
        pipeline.systemPrompt,
        pipeline.extractionPrompt,
        pipeline.schema,
        "application/pdf"
      )) as any;

      if (extractedData.error) {
        throw new Error(`LLM Extraction Error: ${extractedData.error}`);
      }

      // 5. Update DB
      await SubmissionService.updateStatus(
        submissionId,
        "completed",
        extractedData,
        extractedData
      );

      log.info(
        {
          dataKeys: Object.keys(extractedData),
        },
        "Submission completed"
      );
    } catch (error: unknown) {
      const err = error as Error & { code?: string };
      log.error(
        {
          error: err.message,
          code: err.code,
          stack: err.stack,
        },
        "Job failed"
      );

      await SubmissionService.updateStatus(submissionId, "failed", {
        error: err.message,
      });

      throw error;
    }
  },
  { connection }
);

logger.info("Worker ready to process jobs");
