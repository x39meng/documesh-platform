import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "thread-stream"],
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
