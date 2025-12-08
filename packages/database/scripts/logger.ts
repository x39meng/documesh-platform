// The same as core logger but due to circular dependencies we can't import it

import pino from "pino";
import { env } from "@repo/config";

const isDevelopment = env.NODE_ENV === "development";

export const logger = pino({
  level: isDevelopment ? "debug" : "info",
});
