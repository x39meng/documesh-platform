import {
  pgTable,
  text,
  uuid,
  pgEnum,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

/**
 * Organizations Table
 * Represents a tenant or company in the system.
 * - Single Source of Truth for API Keys and IP Allowlisting.
 */
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  /**
   * The secret key used for server-to-server API authentication.
   * Must be kept secure and rotated if compromised.
   */
  apiKey: text("api_key").unique().notNull(),
  /**
   * List of CIDR blocks or IP addresses allowed to access the API.
   * Enforced by Hono middleware.
   * @type {string[]}
   */
  allowedIps: jsonb("allowed_ips").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Users Table
 * Global identity for human users.
 * Managed by Better-Auth.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

/**
 * Sessions Table
 * Active user sessions managed by Better-Auth.
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
});

/**
 * Accounts Table
 * Linked OAuth accounts (Google, GitHub, etc.) managed by Better-Auth.
 */
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  /**
   * OAuth Access Token from the provider.
   * Used to access provider APIs on behalf of the user.
   */
  accessToken: text("access_token"),
  /**
   * OAuth Refresh Token.
   * Used to obtain new access tokens when they expire.
   * Critical for long-running background syncs.
   */
  refreshToken: text("refresh_token"),
  /**
   * OIDC ID Token.
   * Contains identity claims about the user.
   */
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

/**
 * Verifications Table
 * Temporary tokens for email verification, password reset, etc.
 */
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

/**
 * Memberships Table
 * Junction table linking Users to Organizations with a Role.
 */
export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull(),
});

/**
 * Submissions Table
 * The core unit of work in the DocuMesh platform.
 * Represents a document uploaded for processing.
 */
export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),

  /**
   * The Discriminator.
   * Determines which Pipeline to execute and which UI Component to render.
   * e.g., 'RESUME', 'INVOICE', 'CONTRACT'.
   */
  documentType: text("document_type").notNull(),

  /**
   * The Version Lock.
   * Specifies the exact version of the pipeline logic used for this submission.
   * Ensures reproducibility: re-processing an old file uses the old logic unless explicitly upgraded.
   * e.g., 'resume-v1.0.0'.
   */
  pipelineVersion: text("pipeline_version").notNull(),

  fileKey: text("file_key").notNull(),
  status: statusEnum("status").default("pending").notNull(),

  /**
   * The Polymorphic Payload.
   * Stores the structured data extracted from the document.
   * The shape of this JSON is determined by the `documentType` and `pipelineVersion`.
   */
  finalData: jsonb("final_data"),

  /**
   * The Raw Output.
   * Stores the raw, unvalidated output from the LLM or OCR engine.
   * Used for debugging, diffing, and improving prompt engineering.
   */
  rawExtraction: jsonb("raw_extraction"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
