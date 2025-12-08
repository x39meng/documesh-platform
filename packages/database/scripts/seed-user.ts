import { db, organizations, users, memberships } from "@/index";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

async function seedUser() {
  logger.info("Seeding User...");

  const email = "admin@documesh.com";
  const password = "password123";
  const name = "Admin User";

  // 1. Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    logger.info("User already exists");
    process.exit(0);
  }

  logger.info("Creating user via API...");

  // 2. Call Sign Up API
  try {
    const response = await fetch(
      "http://localhost:3000/api/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to sign up: ${response.status} ${text}`);
    }

    const data = await response.json();
    logger.info({ data }, "User created via API");

    // 3. Link to Organization
    // Get the user from DB to be sure (or use data if it contains ID)
    // Better-auth returns user object usually.

    // Fetch user from DB to get ID reliably
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error("User created but not found in DB?");
    }

    // Get Org
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.apiKey, "sk_test_12345"))
      .limit(1);

    if (!org) {
      throw new Error(
        "Organization 'Acme Corp' not found. Run seed-security first."
      );
    }

    // Create Membership
    await db.insert(memberships).values({
      userId: user.id,
      orgId: org.id,
      role: "owner",
    });

    logger.info(
      {
        user: user.email,
        org: org.name,
        role: "owner",
      },
      "Linked user to org"
    );
    logger.info({ email, password }, "Login Credentials");
  } catch (error) {
    const err = error as Error;
    logger.error({ error: err.message }, "Failed to seed user");
    process.exit(1);
  }

  process.exit(0);
}

seedUser();
