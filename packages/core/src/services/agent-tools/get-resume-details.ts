import { createLogger } from "@repo/core/lib/logger";
import { SubmissionService } from "@repo/core/services/submission.service";

const logger = createLogger("tool:get-resume-details");

export async function handleGetResumeDetails(
  args: { id: string },
  orgId: string,
  requestId: string
) {
  const startTime = Date.now();
  logger.info({ args, orgId, requestId }, "Tool Call: getResumeDetails");
  const { id } = args;
  const submission = await SubmissionService.findById(id);

  if (submission && submission.orgId !== orgId) {
    logger.warn(
      { id, orgId, requestId },
      "Tool Access Denied: getResumeDetails"
    );
    return {
      error: "Access denied. Document does not belong to your organization.",
    };
  }

  const duration = Date.now() - startTime;
  logger.info(
    { id, found: !!submission, duration, requestId },
    "Tool Result: getResumeDetails"
  );
  return submission;
}
