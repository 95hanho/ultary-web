import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  compiler: {
    emotion: true,
  },
  // 상위 D:\workspace\nextjs\package-lock.json 때문에 root가 잘못 잡히면
  // /login, /api/* 등이 404가 난다. 이 프로젝트를 Turbopack root로 고정.
  turbopack: {
    root: projectRoot,
  },
  // 개발 모드에서 상단 프로그레스 바 숨기기
  devIndicators: false,
  // FileSummary CDN (share seed cafe24) — next/image 외부 호스트 허용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ehfqntuqntu.cdn1.cafe24.com',
        pathname: '/ultary/**',
      },
    ],
  },
};

export default nextConfig;
