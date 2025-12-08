import { db, submissions } from "@repo/database";
import { eq, desc } from "drizzle-orm";
import { InsertSubmissionSchema } from "@repo/database";
import { z } from "zod";

type CreateSubmissionInput = z.infer<typeof InsertSubmissionSchema>;

export const SubmissionRepository = {
  async create(input: CreateSubmissionInput) {
    // Explicitly cast to any to bypass complex Drizzle/Zod type mismatch for now
    // The runtime validation ensures correctness
    const [record] = await db
      .insert(submissions)
      .values(input as any)
      .returning();
    return record;
  },

  async findById(id: string) {
    return db.query.submissions.findFirst({
      where: eq(submissions.id, id),
    });
  },

  async findByOrgId(orgId: string, limit = 50) {
    return db.query.submissions.findMany({
      where: eq(submissions.orgId, orgId),
      orderBy: [desc(submissions.createdAt)],
      limit: limit,
    });
  },

  async updateStatus(
    id: string,
    status: "pending" | "processing" | "completed" | "failed",
    finalData?: unknown,
    rawExtraction?: unknown
  ) {
    const [record] = await db
      .update(submissions)
      .set({
        status,
        finalData: finalData as any,
        rawExtraction: rawExtraction as any,
      })
      .where(eq(submissions.id, id))
      .returning();
    return record;
  },
};
