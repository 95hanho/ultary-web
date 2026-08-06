import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16+: 기존 middleware 역할.
 * 인증 가드, 리다이렉트, 헤더 가공 등은 여기에 추가.
 */
export function proxy(_request: NextRequest) {
  // TODO: auth / redirect / header 로직
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 정적 자산·이미지·favicon 등은 제외.
     * 필요 시 경로를 더 좁히거나 넓힌다.
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
