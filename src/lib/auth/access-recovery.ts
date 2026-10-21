import 'server-only';

import { cookies } from 'next/headers';
import { isHttpError, isRecord } from '@/lib/api/error';
import type { HttpInit } from '@/lib/api/http';
import {
  ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE,
  ADMIN_ACCESS_TOKEN_COOKIE, ADMIN_REFRESH_TOKEN_COOKIE,
} from '@/lib/auth/cookie-names';
import { applyTokensToCookieJar, clearAuthCookieJar, refreshViaSpringLocked } from '@/lib/auth/session';
import { refreshAdminViaSpringLocked } from '@/lib/auth/admin-session';
import { applyAdminTokensToCookieJar, clearAdminAuthCookieJar } from '@/lib/auth/cookies';

/** JWT 인증 단계의 TOKEN_EXPIRED에만 재발급하고, 업무 요청은 최대 한 번만 재전송한다. */
export async function recoverExpiredAccess<T>(
  url: string,
  init: HttpInit | undefined,
  send: (init?: HttpInit) => Promise<T>,
): Promise<T> {
  try {
    return await send(init);
  } catch (error) {
    const headers = new Headers(init?.headers);
    const authorization = headers.get('authorization');
    if (!authorization?.startsWith('Bearer ') || !isHttpError(error) || error.status !== 401
      || !isRecord(error.data) || error.data.code !== 'TOKEN_EXPIRED') throw error;

    const admin = url.startsWith('/api/v1/admin/');
    const jar = await cookies();
    const currentAccess = jar.get(admin ? ADMIN_ACCESS_TOKEN_COOKIE : ACCESS_TOKEN_COOKIE)?.value;
    let access = currentAccess && currentAccess !== authorization.slice(7) ? currentAccess : undefined;
    if (!access) {
      const refresh = jar.get(admin ? ADMIN_REFRESH_TOKEN_COOKIE : REFRESH_TOKEN_COOKIE)?.value;
      if (!refresh) {
        if (admin) await clearAdminAuthCookieJar(); else await clearAuthCookieJar();
        throw error;
      }
      const session = await (admin ? refreshAdminViaSpringLocked(refresh) : refreshViaSpringLocked(refresh));
      if (!session.ok) {
        if (session.clearCookies) {
          if (admin) await clearAdminAuthCookieJar(); else await clearAuthCookieJar();
        }
        throw {
          status: 401, url, message: session.message,
          data: { code: session.message, message: session.message, detail: '로그인이 필요합니다.' },
        };
      }
      access = session.accessToken;
      if (session.tokens) {
        if (admin) await applyAdminTokensToCookieJar(session.tokens);
        else await applyTokensToCookieJar(session.tokens);
      }
    }

    // FormData/JSON도 인증 필터에서 거절된 경우에만 다시 보낸다. 두 번째 실패는 그대로 반환한다.
    headers.set('Authorization', `Bearer ${access}`);
    return send({ ...init, headers: Object.fromEntries(headers.entries()) });
  }
}
