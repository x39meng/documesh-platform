import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth";

type Variables = {
  orgId: string;
};

const app = new Hono<{ Variables: Variables }>();

// Public Health Check
app.get("/health", (c) => c.text("OK"));

// Protected Routes
app.use("/api/*", authMiddleware);

app.get("/api/test", (c) => {
  const orgId = c.get("orgId");
  return c.json({
    message: "Authenticated sDuccessfully",
    orgId,
    timestamp: new Date().toISOString(),
  });
});

export default {
  port: 3001,
  fetch: app.fetch,
};
