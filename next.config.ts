import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  // Cloudflare Pages 配置
  experimental: {
    // 启用服务端 Actions 支持
    serverActions: {
      allowedOrigins: ['*.pages.dev', 'localhost:3000'],
    },
  },
};

export default nextConfig;
