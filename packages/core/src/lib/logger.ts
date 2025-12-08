import pino from "pino";
import { env } from "@repo/config";

const isDevelopment = env.NODE_ENV === "development";

export const logger = pino({
  level: isDevelopment ? "debug" : "info",
  base: {
    env: env.APP_ENV,
  },
});

export const createLogger = (service: string) => {
  return logger.child({ service });
};

export const withSubmissionContext = (submissionId: string) => {
  return logger.child({ submissionId });
};

export const withOrgContext = (orgId: string) => {
  return logger.child({ orgId });
};
