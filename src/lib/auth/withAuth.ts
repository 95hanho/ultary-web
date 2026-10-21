import 'server-only';

import {
  applyTokensToCookieJar,
  resolveSession,
  sessionUnauthorized,
} from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext<P> = { params: Promise<P> };

export type AuthedCtx<P extends Record<string, string> = Record<string, never>> = {
  request: NextRequest;
  accessToken: string;
  params: P;
};

export type OptionalAuthCtx<P extends Record<string, string> = Record<string, never>> = {
  request: NextRequest;
  accessToken: string | null;
  params: P;
};

type AuthedHandler<P extends Record<string, string>> = (
  ctx: AuthedCtx<P>,
) => Promise<NextResponse>;

type OptionalHandler<P extends Record<string, string>> = (
  ctx: OptionalAuthCtx<P>,
) => Promise<NextResponse>;

/**
 * 인증 필수 BFF 핸들러.
 * access 없으면 Spring refresh 시도 후 쿠키 세팅. (proxy에서는 refresh 안 함)
 */
export function withAuth<P extends Record<string, string> = Record<string, never>>(
  handler: AuthedHandler<P>,
) {
  return async (request: NextRequest, context?: RouteContext<P>) => {
    const session = await resolveSession(request);
    if (!session.ok) return sessionUnauthorized(session);
    if (session.tokens) await applyTokensToCookieJar(session.tokens);

    const params = (context ? await context.params : {}) as P;
    const response = await handler({
      request,
      accessToken: session.accessToken,
      params,
    });
    return response;
  };
}

/**
 * 게스트 허용. 로그인 시 access(또는 refresh→access) 전달.
 * 공유 피드 단건 GET 등.
 */
export function withOptionalAuth<P extends Record<string, string> = Record<string, never>>(
  handler: OptionalHandler<P>,
) {
  return async (request: NextRequest, context?: RouteContext<P>) => {
    const session = await resolveSession(request);
    const params = (context ? await context.params : {}) as P;

    if (!session.ok) {
      return handler({ request, accessToken: null, params });
    }
    if (session.tokens) await applyTokensToCookieJar(session.tokens);

    const response = await handler({
      request,
      accessToken: session.accessToken,
      params,
    });
    return response;
  };
}

/**
 * 기존 try/requireAccessToken 패턴용 헬퍼.
 * run이 반환한 NextResponse에 refresh 쿠키를 붙인다.
 */
export async function runAuthed(
  request: NextRequest,
  run: (accessToken: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const session = await resolveSession(request);
  if (!session.ok) return sessionUnauthorized(session);
  if (session.tokens) await applyTokensToCookieJar(session.tokens);
  const response = await run(session.accessToken);
  return response;
}
