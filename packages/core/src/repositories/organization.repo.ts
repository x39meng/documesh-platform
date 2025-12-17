import { db, organizations } from "@repo/database";
import { eq } from "drizzle-orm";

export const OrganizationRepository = {
  async findByApiKey(apiKey: string) {
    const results = await db
      .select()
      .from(organizations)
      .where(eq(organizations.apiKey, apiKey))
      .limit(1);

    return results[0];
  },

  async findById(id: string) {
    const results = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return results[0];
  },

  async list() {
    return await db.select().from(organizations);
  },

  async create(data: { name: string }) {
    // Simple key generation: sk_live_ + random
    const apiKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const results = await db
      .insert(organizations)
      .values({
        name: data.name,
        apiKey: apiKey,
        allowedIps: [],
      })
      .returning();

    return results[0];
  },

  async update(id: string, data: { allowedIps?: string[] }) {
    const updateData: Partial<typeof organizations.$inferInsert> = {};
    if (data.allowedIps) updateData.allowedIps = data.allowedIps;

    const results = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    return results[0];
  },

  async rotateKey(id: string) {
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const results = await db
      .update(organizations)
      .set({ apiKey: newKey })
      .where(eq(organizations.id, id))
      .returning();

    return results[0];
  },
};
