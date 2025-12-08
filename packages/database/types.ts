import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import * as schema from "@repo/database/schema";

// Organizations
export type Organization = InferSelectModel<typeof schema.organizations>;
export type NewOrganization = InferInsertModel<typeof schema.organizations>;

// Users
export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

// Sessions
export type Session = InferSelectModel<typeof schema.sessions>;
export type NewSession = InferInsertModel<typeof schema.sessions>;

// Accounts
export type Account = InferSelectModel<typeof schema.accounts>;
export type NewAccount = InferInsertModel<typeof schema.accounts>;

// Verifications
export type Verification = InferSelectModel<typeof schema.verifications>;
export type NewVerification = InferInsertModel<typeof schema.verifications>;

// Memberships
export type Membership = InferSelectModel<typeof schema.memberships>;
export type NewMembership = InferInsertModel<typeof schema.memberships>;

// Submissions
export type Submission = InferSelectModel<typeof schema.submissions>;
export type NewSubmission = InferInsertModel<typeof schema.submissions>;
