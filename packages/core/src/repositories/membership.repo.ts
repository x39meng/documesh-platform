import { db, memberships } from "@repo/database";
import { eq } from "drizzle-orm";

export const MembershipRepository = {
  async findByUserId(userId: string) {
    return db.query.memberships.findFirst({
      where: eq(memberships.userId, userId),
    });
  },
};
