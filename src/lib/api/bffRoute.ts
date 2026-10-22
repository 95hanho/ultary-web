import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/error';
import type { Params, RequestHeaders } from '@/lib/api/http';
import { requireAdminSession } from '@/lib/auth/admin-session';
import {
  applyTokensToCookieJar,
  clearAuthCookieJar,
  resolveSessionFromCookies,
} from '@/lib/auth/session';

export { runAuthed, withAuth, withOptionalAuth } from '@/lib/auth/withAuth';

/** Spring 연동 전 BFF 스켈레톤 응답 */
export function notImplemented(feature: string) {
  return NextResponse.json(
    {
      success: false,
      code: 'NOT_IMPLEMENTED',
      message: `${feature} is not implemented yet`,
      data: null,
    },
    { status: 501 },
  );
}

export function handleBffError(err: unknown) {
  const { status, payload } = toErrorResponse(err);
  return NextResponse.json(payload, { status });
}

/** 성공 응답 `{ success, data }` */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function unauthorized(detail = '로그인이 필요합니다.') {
  return NextResponse.json(
    { message: 'UNAUTHORIZED', detail },
    { status: 401 },
  );
}

export function badRequest(message: string, detail?: string) {
  return NextResponse.json(
    { message, detail: detail ?? message },
    { status: 400 },
  );
}

/** Bearer 헤더 */
export function bearer(accessToken: string): RequestHeaders {
  return { Authorization: `Bearer ${accessToken}` };
}

/**
 * access 쿠키 필수. 없으면 refresh로 Spring 재발급 (공유 락).
 * 실제 인증 거부만 쿠키를 삭제한다. 서버 장애는 503으로 반환하고 세션을 보존한다.
 */
export async function requireAccessToken(): Promise<string | NextResponse> {
  const session = await resolveSessionFromCookies();
  if (!session.ok) {
    if (session.clearCookies) await clearAuthCookieJar();
    if (session.message === 'REFRESH_RETRY_EXHAUSTED') return handleBffError({ status: 503, url: '', data: null, message: session.message });
    return unauthorized(
      session.message === 'REFRESH_UNAUTHORIZED'
        ? '세션이 만료되었습니다. 다시 로그인해 주세요.'
        : undefined,
    );
  }
  if (session.tokens) await applyTokensToCookieJar(session.tokens);
  return session.accessToken;
}

export function isUnauthorized(
  value: string | NextResponse,
): value is NextResponse {
  return typeof value !== 'string';
}

/** 관리자 access 쿠키. 없으면 관리자 refresh 로 재발급. 회원 쿠키는 보지 않는다. */
export async function requireAdminAccessToken(): Promise<string | NextResponse> {
  const session = await requireAdminSession();
  if (!session.ok) {
    if (session.message === 'REFRESH_RETRY_EXHAUSTED') return handleBffError({ status: 503, url: '', data: null, message: session.message });
    return unauthorized(
      session.message === 'REFRESH_UNAUTHORIZED'
        ? '세션이 만료되었습니다. 다시 로그인해 주세요.'
        : undefined,
    );
  }
  return session.accessToken;
}

/** Request URL query → plain object */
export function queryParams(request: Request): Record<string, string> {
  const { searchParams } = new URL(request.url);
  return Object.fromEntries(searchParams.entries());
}

/** JSON body (실패 시 빈 객체) — Spring form 전달용 */
export async function readJsonBody(request: Request): Promise<Params> {
  try {
    return (await request.json()) as Params;
  } catch {
    return {};
  }
}
