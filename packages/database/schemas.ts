import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as schema from "@repo/database/schema";

// Organizations
export const SelectOrganizationSchema = createSelectSchema(
  schema.organizations
);
export const InsertOrganizationSchema = createInsertSchema(
  schema.organizations
);

// Users
export const SelectUserSchema = createSelectSchema(schema.users);
export const InsertUserSchema = createInsertSchema(schema.users);

// Sessions
export const SelectSessionSchema = createSelectSchema(schema.sessions);
export const InsertSessionSchema = createInsertSchema(schema.sessions);

// Accounts
export const SelectAccountSchema = createSelectSchema(schema.accounts);
export const InsertAccountSchema = createInsertSchema(schema.accounts);

// Verifications
export const SelectVerificationSchema = createSelectSchema(
  schema.verifications
);
export const InsertVerificationSchema = createInsertSchema(
  schema.verifications
);

// Memberships
export const SelectMembershipSchema = createSelectSchema(schema.memberships);
export const InsertMembershipSchema = createInsertSchema(schema.memberships);

// Submissions (critical for document processing)
export const SelectSubmissionSchema = createSelectSchema(schema.submissions);
export const InsertSubmissionSchema = createInsertSchema(schema.submissions, {
  // Add runtime validation on top of types
  documentType: (schema) => schema.documentType.min(1),
  pipelineVersion: (schema) => schema.pipelineVersion.min(1),
  fileKey: (schema) => schema.fileKey.min(1),
  status: (schema) => schema.status,
});
