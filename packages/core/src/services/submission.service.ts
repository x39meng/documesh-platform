import { SubmissionRepository } from "@repo/core/repositories/submission.repo";
import { InsertSubmissionSchema } from "@repo/database";
import { z } from "zod";

type CreateSubmissionInput = z.infer<typeof InsertSubmissionSchema>;

export const SubmissionService = {
  async create(input: CreateSubmissionInput) {
    const validated = InsertSubmissionSchema.parse(input);
    return SubmissionRepository.create(validated);
  },

  async findById(id: string) {
    return SubmissionRepository.findById(id);
  },

  async findByOrgId(orgId: string) {
    return SubmissionRepository.findByOrgId(orgId);
  },

  async updateStatus(
    id: string,
    status: "pending" | "processing" | "completed" | "failed",
    finalData?: unknown,
    rawExtraction?: unknown
  ) {
    return SubmissionRepository.updateStatus(
      id,
      status,
      finalData,
      rawExtraction
    );
  },
};
