import { z } from "zod";

/**
 * -----------------------------------------------------------------------------
 * 1. Define Server-Side Secrets
 * -----------------------------------------------------------------------------
 * Strictly for Node.js/Bun. Never exposed to the browser.
 */
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z
    .enum(["local", "test", "dev", "staging", "production"])
    .default("local"),
  USE_LOCALSTACK: z
    .string()
    .transform((val) => val === "true")
    .default(false),
  MOCK_LLM: z
    .string()
    .transform((val) => val === "true")
    .default(false),
  DEMO_ORG_ID: z.string().optional(),

  // Infrastructure
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Services
  GEMINI_API_KEY: z.string().min(1),
  AWS_REGION: z.string().default("us-east-1"),

  // Authentication
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),

  // Optional AWS Keys (Required only for LocalStack/Local Dev)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().min(1),
});

/**
 * -----------------------------------------------------------------------------
 * 2. Define Client-Side Public Variables
 * -----------------------------------------------------------------------------
 * Exposed to the browser. MUST start with NEXT_PUBLIC_.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(), // e.g. http://localhost:3000
  NEXT_PUBLIC_API_URL: z.string().url(), // e.g. http://localhost:3001
  NEXT_PUBLIC_AUTH_URL: z.string().url(), // e.g. http://localhost:3000 (Web) or http://localhost:3002 (Admin)
});

/**
 * -----------------------------------------------------------------------------
 * 3. Runtime Mapping
 * -----------------------------------------------------------------------------
 * We must manually map process.env to ensure Next.js tree-shaking works.
 */
const runtimeEnv = {
  NODE_ENV: process.env.NODE_ENV,
  APP_ENV: process.env.APP_ENV,
  USE_LOCALSTACK: process.env.USE_LOCALSTACK,
  MOCK_LLM: process.env.MOCK_LLM,
  DEMO_ORG_ID: process.env.DEMO_ORG_ID,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,

  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,

  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
};

/**
 * -----------------------------------------------------------------------------
 * 4. Validation Logic
 * -----------------------------------------------------------------------------
 */
const mergedSchema = serverSchema.extend(clientSchema.shape);

// Intelligence: Skip validation if in CI or specific build phases
const isBuildPhase =
  process.env.CI === "true" ||
  process.env.npm_lifecycle_event === "build" ||
  !!process.env.SKIP_ENV_VALIDATION;

let env: z.infer<typeof mergedSchema>;

if (isBuildPhase) {
  // Return a partial object casted as full to satisfy TS during build
  env = process.env as unknown as z.infer<typeof mergedSchema>;
} else {
  const parsed = mergedSchema.safeParse(runtimeEnv);

  if (!parsed.success) {
    console.error("\n❌ Invalid environment variables:");
    const fieldErrors = parsed.error.flatten().fieldErrors;
    Object.entries(fieldErrors).forEach(([key, errors]) => {
      console.error(`   - ${key}: ${errors?.join(", ")}`);
    });
    console.error("\n🚫 App exiting due to missing config.\n");
    process.exit(1);
  }

  env = parsed.data;
}

export { env };
