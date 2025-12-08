import { Context, Next } from "hono";
import { AuthService } from "@repo/core";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const apiKey = authHeader.replace("Bearer ", "");

  // Get Client IP
  // In production (behind ALB), we should look at X-Forwarded-For
  const forwardedFor = c.req.header("X-Forwarded-For");
  const clientIp = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : "127.0.0.1"; // Fallback for local dev

  const result = await AuthService.validateClientAccess(apiKey, clientIp);

  if (!result.valid) {
    if (result.reason === "invalid_key") {
      return c.json({ error: "Invalid API Key" }, 401);
    } else if (result.reason === "ip_not_allowed") {
      return c.json({ error: "Access denied: IP not allowed" }, 403);
    } else {
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }

  // Attach Org ID to context
  c.set("orgId", result.orgId);
  return next();
}
