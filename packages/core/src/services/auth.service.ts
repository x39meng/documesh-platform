import { Address4, Address6 } from "ip-address";
import { OrganizationRepository } from "@repo/core/repositories/organization.repo";
import { createLogger } from "../lib/logger";

const logger = createLogger("auth");

export interface AccessResult {
  valid: boolean;
  orgId?: string;
  reason?: "invalid_key" | "ip_not_allowed" | "internal_error";
}

export const AuthService = {
  async validateClientAccess(
    apiKey: string,
    requestIp: string
  ): Promise<AccessResult> {
    try {
      const org = await OrganizationRepository.findByApiKey(apiKey);

      if (!org) {
        return { valid: false, reason: "invalid_key" };
      }

      const allowedIps = org.allowedIps as string[];

      if (!allowedIps || allowedIps.length === 0) {
        return { valid: false, reason: "ip_not_allowed" };
      }

      const isAllowed = this._checkIpAllowed(requestIp, allowedIps);

      if (isAllowed) {
        return { valid: true, orgId: org.id };
      } else {
        return { valid: false, reason: "ip_not_allowed" };
      }
    } catch (error) {
      const err = error as Error;
      logger.error(
        {
          error: err.message,
          stack: err.stack,
        },
        "Access validation error"
      );
      return { valid: false, reason: "internal_error" };
    }
  },

  _checkIpAllowed(requestIp: string, allowedIps: string[]): boolean {
    return allowedIps.some((allowedIp) => {
      try {
        if (allowedIp.includes("/")) {
          if (requestIp.includes(":")) {
            const addr = new Address6(requestIp);
            const subnet = new Address6(allowedIp);
            return addr.isInSubnet(subnet);
          } else {
            const addr = new Address4(requestIp);
            const subnet = new Address4(allowedIp);
            return addr.isInSubnet(subnet);
          }
        } else {
          return allowedIp === requestIp;
        }
      } catch (e) {
        const err = e as Error;
        logger.error(
          {
            allowedIp,
            error: err.message,
          },
          "Invalid IP format in allowlist"
        );
        return false;
      }
    });
  },
};
