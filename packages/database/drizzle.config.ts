import { defineConfig } from "drizzle-kit";
import { env } from "@repo/config";

export default defineConfig({
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
