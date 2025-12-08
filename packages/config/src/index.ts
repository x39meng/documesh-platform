export * from "./env";

/**
 * Application Constants (non-env config). These don't change based on environment.
 */
export const APP_CONFIG = {
  DEMO_ORG_ID: "78466464-55d8-435b-96fc-412e7c0612df",
  QUEUE_NAME: "document-processing-queue",
  DOCUMENT_TYPES: {
    RESUME: "RESUME",
    INVOICE: "INVOICE",
  } as const,
  DEFAULT_PIPELINE_VERSIONS: {
    RESUME: "resume-v1.0.0",
    INVOICE: "invoice-v1.0.0",
  } as const,
  POLLING_INTERVAL_MS: 2000,
  MAX_POLL_ATTEMPTS: 30,
} as const;

export type DocumentType = keyof typeof APP_CONFIG.DOCUMENT_TYPES;
