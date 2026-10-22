import 'server-only';

import { prepareSpringRequest } from '@/lib/api/spring-request';
import { clientConnectionHeaders } from '@/lib/auth/client-connection';
import type { TokenResponse } from '@/types/api';

const RETRY_DELAY_MS = 2_000;
const MAX_RETRIES = 2;
// 전체 최대 16초: 브라우저 공통 HTTP timeout(20초) 안에 최종 결과를 반환한다.
const ATTEMPT_TIMEOUT_MS = 4_000;

type RefreshResult =
  | { ok: true; accessToken: string; tokens: TokenResponse }
  | { ok: false; clearCookies: boolean; message: string };

function parseTokens(raw: unknown): TokenResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as Partial<TokenResponse> & { data?: Partial<TokenResponse> };
  const tokens = body.data ?? body;
  if (
    typeof tokens.accessToken !== 'string' || !tokens.accessToken ||
    typeof tokens.refreshToken !== 'string' || !tokens.refreshToken
  ) return null;
  return tokens as TokenResponse;
}

/** 일시 장애는 2회 재시도 후 세션을 보존한다. 다음 요청/새로고침에서 다시 시도한다. */
export async function requestRefreshTokens(
  endpoint: string,
  refreshToken: string,
): Promise<RefreshResult> {
  const connectionHeaders = await clientConnectionHeaders();
  const prepared = prepareSpringRequest(endpoint, {
    method: 'POST',
    headers: { ...connectionHeaders, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const response = await fetch(prepared.url, {
        ...prepared.init,
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        return { ok: false, clearCookies: true, message: 'REFRESH_UNAUTHORIZED' };
      }
      if (response.ok) {
        const tokens = parseTokens(await response.json().catch(() => null));
        if (tokens) return { ok: true, accessToken: tokens.accessToken, tokens };
        // 잘못된 업스트림 응답은 일시적인 gateway 실패로 간주한다.
      } else if (response.status === 400) {
        return { ok: false, clearCookies: true, message: 'REFRESH_UNAUTHORIZED' };
      }
      console.warn('[auth] refresh upstream unavailable', { status: response.status, attempt: attempt + 1 });
    } catch {
      console.warn('[auth] refresh connection unavailable', { attempt: attempt + 1 });
    } finally {
      clearTimeout(timeout);
    }
  }
  return { ok: false, clearCookies: false, message: 'REFRESH_RETRY_EXHAUSTED' };
}
