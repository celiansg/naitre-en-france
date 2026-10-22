import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@naitre/engine", "@naitre/data", "@naitre/ui"],
};

export default nextConfig;
