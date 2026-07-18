import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@eduvy/config", "@eduvy/contracts"],
};

export default nextConfig;
