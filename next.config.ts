import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["stripe", "@supabase/ssr"],
};

export default nextConfig;
