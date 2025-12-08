export * from "@repo/database/schemas";
export * from "@repo/database/schema";
export * from "@repo/database/types";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@repo/database/schema";
import { env } from "@repo/config";

const connectionString = env.DATABASE_URL;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
