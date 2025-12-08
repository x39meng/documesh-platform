/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/core", "@repo/database", "@repo/ui", "@repo/config"],
};

module.exports = nextConfig;
