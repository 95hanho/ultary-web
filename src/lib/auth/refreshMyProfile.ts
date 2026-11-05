import { applyFooterProfile } from '@/components/common/FooterMenu';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { invalidateMainStoryOwners, patchMainSessionMe } from '@/lib/feed/main-session';
import type { BffEnvelope, MeResponse } from '@/types/api';

/**
 * GET /auth/me 로 내 프로필을 다시 받아
 * 푸터 닉네임·아바타 캐시와 메인 세션 me를 맞춘다.
 * 닉네임태그 변경 직후 울타리 URL·표시명이 바로 바뀌게 한다.
 */
export async function refreshMyProfile() {
  const res = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
  const me = res.data;
  if (!me) return null;
  applyFooterProfile(me);
  patchMainSessionMe(me);
  invalidateMainStoryOwners();
  return me;
}
