"use client";

import { SubmitButton } from "@/components/submit-button";
import { rotateApiKey, updateAllowedIps } from "@/actions/organization";
import { toast } from "sonner";
import { z } from "zod";

interface RotateKeyFormProps {
  orgId: string;
}

export function RotateKeyForm({ orgId }: RotateKeyFormProps) {
  const action = async () => {
    try {
      await rotateApiKey(orgId);
      toast.success("API Key rotated successfully");
    } catch (error) {
      toast.error("Failed to rotate API key");
    }
  };

  return (
    <form action={action}>
      <SubmitButton variant="destructive" size="sm" type="submit">
        Rotate API Key
      </SubmitButton>
    </form>
  );
}

interface UpdateIpsFormProps {
  orgId: string;
  initialIps: string[];
}

const IpLineSchema = z.string().refine(
  (val) => {
    const ipSchema = z.union([z.ipv4(), z.ipv6()]);

    if (val.includes("/")) {
      const [ip, cidr] = val.split("/");
      const result = ipSchema.safeParse(ip);
      const cidrNum = parseInt(cidr, 10);
      return (
        result.success && !isNaN(cidrNum) && cidrNum >= 0 && cidrNum <= 128
      );
    }
    return ipSchema.safeParse(val).success;
  },
  { message: "Invalid IP address or CIDR notation" }
);

export function UpdateIpsForm({ orgId, initialIps }: UpdateIpsFormProps) {
  const action = async (formData: FormData) => {
    try {
      const rawInput = formData.get("ips") as string;
      const lines = rawInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      // Validate
      const result = z.array(IpLineSchema).safeParse(lines);

      if (!result.success) {
        // Find the first error index to give better feedback
        const firstErrorIndex = result.error.issues[0].path[0];
        const invalidLine = lines[firstErrorIndex as number];
        toast.error(
          `Invalid IP/CIDR at line ${Number(firstErrorIndex) + 1}: ${invalidLine}`
        );
        return;
      }

      await updateAllowedIps(orgId, lines);
      toast.success("IP Allowlist updated successfully");
    } catch (error) {
      toast.error("Failed to update IP Allowlist");
    }
  };

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Allowed IPs</label>
        <textarea
          name="ips"
          defaultValue={initialIps.join("\n")}
          className="flex min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          placeholder="192.168.1.1/32&#10;10.0.0.0/24"
        />
        <p className="text-xs text-muted-foreground">
          Enter one IP or CIDR range per line. Leave empty to allow all IPs (Not
          Recommended).
        </p>
      </div>
      <SubmitButton type="submit">Save IP List</SubmitButton>
    </form>
  );
}
