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
  // CDN 절대 URL + Spring이 /uploads 로 여는 업로드 파일.
  // 상대경로 업로드(images/…)는 /api/files/{id}/content 이고 MediaImage가 처리한다.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ehfqntuqntu.cdn1.cafe24.com',
        pathname: '/ultary/**',
      },
      {
        protocol: 'https',
        hostname: '95hanho.pe.kr',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9377',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
