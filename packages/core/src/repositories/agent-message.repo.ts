import { db, agentMessages } from "@repo/database";
import { eq, asc, desc, sql } from "drizzle-orm";
import { InsertAgentMessageSchema } from "@repo/database";
import { z } from "zod";

type CreateMessageInput = z.infer<typeof InsertAgentMessageSchema>;

export const AgentMessageRepository = {
  async create(input: CreateMessageInput) {
    const [record] = await db
      .insert(agentMessages)
      .values(input as any)
      .returning();
    return record;
  },

  async findByConversation(conversationId: string, limit = 100, offset = 0) {
    return db.query.agentMessages.findMany({
      where: eq(agentMessages.conversationId, conversationId),
      orderBy: [asc(agentMessages.sequenceNumber)],
      limit,
      offset,
    });
  },

  async countByConversation(conversationId: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, conversationId));
    return result[0]?.count || 0;
  },

  async getNextSequenceNumber(conversationId: string): Promise<number> {
    const result = await db
      .select({ max: sql<string>`max(${agentMessages.sequenceNumber})` })
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, conversationId));

    const maxSeq = result[0]?.max;
    return maxSeq ? parseInt(maxSeq) + 1 : 0;
  },

  async deleteByConversation(conversationId: string) {
    // This is typically handled by cascade delete, but available for manual cleanup
    return db
      .delete(agentMessages)
      .where(eq(agentMessages.conversationId, conversationId));
  },

  async findLatestByConversation(conversationId: string, count = 10) {
    return db.query.agentMessages.findMany({
      where: eq(agentMessages.conversationId, conversationId),
      orderBy: [desc(agentMessages.sequenceNumber)],
      limit: count,
    });
  },
};
