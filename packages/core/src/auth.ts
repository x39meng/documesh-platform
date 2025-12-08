import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/database";
import * as schema from "@repo/database/schema";
import { MembershipRepository } from "./repositories/membership.repo";
import { OrganizationRepository } from "./repositories/organization.repo";

// 1. Initialize Better-Auth
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
});

// 2. Web Context (Session-based)
export async function getWebContext(headers: Headers) {
  const session = await auth.api.getSession({
    headers,
  });

  if (!session) {
    return { user: null, orgId: null, type: "WEB" as const };
  }

  // Fetch user's organization (assuming 1:1 or default for now, or from session if stored)
  // For now, let's fetch the first membership or default
  const membership = await MembershipRepository.findByUserId(session.user.id);

  return {
    user: session.user,
    orgId: membership?.orgId || null,
    type: "WEB" as const,
  };
}

// 3. API Context (Token-based)
export async function getApiContext(apiKey: string) {
  const org = await OrganizationRepository.findByApiKey(apiKey);

  if (!org) {
    return { user: null, orgId: null, type: "API" as const };
  }

  return { user: null, orgId: org.id, type: "API" as const };
}
