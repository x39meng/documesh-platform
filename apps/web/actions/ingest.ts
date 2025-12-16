"use server";

import { getUploadUrl, getDownloadUrl } from "@repo/core";
import { InsertSubmissionSchema } from "@repo/database";
import { SubmissionService } from "@repo/core/services/submission.service";
import { documentQueue } from "@/lib/queue";
import { APP_CONFIG, DocumentType } from "@repo/config";

/**
 * Initiate file upload by generating a presigned S3 URL
 */
export async function initiateUpload(filename: string) {
  const orgId = APP_CONFIG.DEMO_ORG_ID;

  const { url, key } = await getUploadUrl(orgId, filename);

  return { url, key };
}

/**
 * Get a presigned download URL for a file
 */
export async function getFileUrl(key: string) {
  return getDownloadUrl(key);
}

/**
 * Finalize upload by creating DB record and enqueuing processing job
 */
export async function finalizeUpload(
  fileKey: string,
  documentType: DocumentType = "RESUME"
) {
  const orgId = APP_CONFIG.DEMO_ORG_ID;

  // Runtime validation of input data
  const validatedInput = InsertSubmissionSchema.parse({
    fileKey,
    status: "pending",
    orgId,
    documentType,
    pipelineVersion: APP_CONFIG.DEFAULT_PIPELINE_VERSIONS[documentType],
  });

  // Create DB record via Service
  const record = await SubmissionService.create(validatedInput);

  // Enqueue processing job
  await documentQueue.add("process-document", {
    submissionId: record.id,
    fileKey,
  });

  return { success: true, id: record.id };
}

import { PublicSubmissionSchema, type PublicSubmission } from "@/lib/types";

/**
 * Get submission by ID
 */
export async function getSubmission(
  id: string
): Promise<PublicSubmission | null> {
  const submission = await SubmissionService.findById(id);

  if (!submission) {
    return null;
  }

  return PublicSubmissionSchema.parse({
    ...submission,
    hasData: !!submission.finalData,
  });
}

/**
 * Get all submissions for the current organization
 */
export async function getSubmissions(): Promise<PublicSubmission[]> {
  const orgId = APP_CONFIG.DEMO_ORG_ID;

  const results = await SubmissionService.findByOrgId(orgId);

  return results.map((s) =>
    PublicSubmissionSchema.parse({
      ...s,
      hasData: !!s.finalData,
    })
  );
}
