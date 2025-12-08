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
};
