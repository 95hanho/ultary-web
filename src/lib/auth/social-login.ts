import 'server-only';

import { springEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { springPostJson } from '@/lib/api/springFetch';
import type {
  SocialLoginRequest,
  SocialLoginResponse,
  SocialProvider,
} from '@/types/api';

/** BFF OAuth 완료 후 Spring 소셜 로그인 호출 */
export async function loginWithSpringSocial(input: {
  provider: SocialProvider;
  providerUserId: string;
  email?: string | null;
  name?: string | null;
}) {
  const body: SocialLoginRequest = {
    provider: input.provider,
    providerUserId: input.providerUserId,
    email: input.email ?? undefined,
    name: input.name ?? undefined,
  };

  return springPostJson<SocialLoginResponse, SocialLoginRequest>(
    springEndpoints.auth.socialLogin,
    body,
  );
}

/** 소셜 콜백 실패를 로그인 페이지 error 쿼리로 바꾼다. */
export function loginFailureRedirectCode(err: unknown, fallback: string) {
  if (isHttpError(err) && isRecord(err.data) && err.data.code === 'ACCOUNT_WITHDRAWN') {
    return 'ACCOUNT_WITHDRAWN';
  }
  return fallback;
}
