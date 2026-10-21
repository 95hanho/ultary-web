import 'server-only';

import { springEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { springPostJson } from '@/lib/api/springFetch';
import { clientConnectionHeaders } from '@/lib/auth/client-connection';
import type {
  MeResponse,
  SocialLoginRequest,
  SocialLoginResponse,
  SocialProvider,
} from '@/types/api';

function socialBody(input: {
  provider: SocialProvider;
  providerUserId: string;
  email?: string | null;
  name?: string | null;
}): SocialLoginRequest {
  return {
    provider: input.provider,
    providerUserId: input.providerUserId,
    email: input.email ?? undefined,
    name: input.name ?? undefined,
  };
}

/** BFF OAuth 완료 후 Spring 소셜 로그인 호출 */
export async function loginWithSpringSocial(input: {
  provider: SocialProvider;
  providerUserId: string;
  email?: string | null;
  name?: string | null;
}) {
  return springPostJson<SocialLoginResponse, SocialLoginRequest>(
    springEndpoints.auth.socialLogin,
    socialBody(input),
    await clientConnectionHeaders(),
  );
}

/** 로그인된 계정에 SNS 연동. Bearer 필수. 응답은 MeResponse */
export async function linkWithSpringSocial(
  accessToken: string,
  input: {
    provider: SocialProvider;
    providerUserId: string;
    email?: string | null;
    name?: string | null;
  },
) {
  return springPostJson<MeResponse, SocialLoginRequest>(
    springEndpoints.auth.socialLink,
    socialBody(input),
    { Authorization: `Bearer ${accessToken}` },
  );
}

/** 소셜 콜백 실패를 로그인 페이지 error 쿼리로 바꾼다. */
export function loginFailureRedirectCode(err: unknown, fallback: string) {
  if (isHttpError(err) && isRecord(err.data)) {
    if (err.data.code === 'ACCOUNT_WITHDRAWN') return 'ACCOUNT_WITHDRAWN';
    if (err.data.code === 'ACCOUNT_SUSPENDED') return 'ACCOUNT_SUSPENDED';
  }
  return fallback;
}

/** 연동 콜백 실패를 returnUrl error 쿼리로 바꾼다. */
export function linkFailureRedirectCode(err: unknown, fallback: string) {
  if (isHttpError(err) && isRecord(err.data) && typeof err.data.code === 'string') {
    const code = err.data.code;
    if (
      code === 'SOCIAL_ALREADY_LINKED' ||
      code === 'SOCIAL_ACCOUNT_IN_USE' ||
      code === 'UNAUTHORIZED' ||
      code === 'ACCOUNT_SUSPENDED' ||
      code === 'ACCOUNT_WITHDRAWN' ||
      code === 'INVALID_SOCIAL_PROVIDER'
    ) {
      return code;
    }
  }
  return fallback;
}
