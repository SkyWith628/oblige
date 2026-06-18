import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 이미지를 위한 독립 실행 번들 (.next/standalone)
  output: "standalone",
};

export default nextConfig;
