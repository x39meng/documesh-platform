import { db, agentConversations } from "@repo/database";
import { eq, and, desc } from "drizzle-orm";
import { InsertAgentConversationSchema } from "@repo/database";
import { z } from "zod";

type CreateConversationInput = z.infer<typeof InsertAgentConversationSchema>;

export const AgentConversationRepository = {
  async create(input: CreateConversationInput) {
    const [record] = await db
      .insert(agentConversations)
      .values(input as any)
      .returning();
    return record;
  },

  async findById(id: string, orgId: string) {
    return db.query.agentConversations.findFirst({
      where: and(
        eq(agentConversations.id, id),
        eq(agentConversations.orgId, orgId)
      ),
    });
  },

  async findByUser(userId: string, orgId: string, limit = 50, offset = 0) {
    return db.query.agentConversations.findMany({
      where: and(
        eq(agentConversations.userId, userId),
        eq(agentConversations.orgId, orgId)
      ),
      orderBy: [desc(agentConversations.updatedAt)],
      limit,
      offset,
    });
  },

  async findByOrg(orgId: string, limit = 50, offset = 0) {
    return db.query.agentConversations.findMany({
      where: eq(agentConversations.orgId, orgId),
      orderBy: [desc(agentConversations.updatedAt)],
      limit,
      offset,
    });
  },

  async update(
    id: string,
    orgId: string,
    updates: { title?: string; updatedAt?: Date }
  ) {
    const [record] = await db
      .update(agentConversations)
      .set(updates)
      .where(
        and(eq(agentConversations.id, id), eq(agentConversations.orgId, orgId))
      )
      .returning();
    return record;
  },

  async deleteById(id: string, orgId: string) {
    // Messages will be cascade deleted by DB
    const [record] = await db
      .delete(agentConversations)
      .where(
        and(eq(agentConversations.id, id), eq(agentConversations.orgId, orgId))
      )
      .returning();
    return record;
  },

  async countByUser(userId: string, orgId: string) {
    const result = await db
      .select({ count: agentConversations.id })
      .from(agentConversations)
      .where(
        and(
          eq(agentConversations.userId, userId),
          eq(agentConversations.orgId, orgId)
        )
      );
    return result.length;
  },
};
