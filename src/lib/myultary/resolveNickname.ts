import 'server-only';

import { cache } from 'react';
import { springGet } from '@/lib/api/springFetch';
import { isHttpError, isRecord } from '@/lib/api/error';

export type NicknameResolve = {
  nickname: string;
  requestedNickname: string;
  redirected: boolean;
};

function mapResolve(raw: unknown, requested: string): NicknameResolve | null {
  if (!isRecord(raw) || typeof raw.nickname !== 'string' || !raw.nickname.trim()) {
    return null;
  }
  const nickname = raw.nickname.trim();
  const requestedNickname =
    typeof raw.requestedNickname === 'string' && raw.requestedNickname.trim()
      ? raw.requestedNickname.trim()
      : requested;
  const redirected =
    typeof raw.redirected === 'boolean' ? raw.redirected : nickname !== requestedNickname;
  return { nickname, requestedNickname, redirected };
}

/** 현재 또는 변경 후 7일 이내 직전 닉네임 → 현재 닉네임. 없으면 null. */
export const resolveNickname = cache(async (nickname: string): Promise<NicknameResolve | null> => {
  const requested = nickname.trim();
  if (!requested) return null;
  try {
    const raw = await springGet<unknown>(
      '/api/v1/public/nicknames/:nickname',
      { nickname: requested },
      undefined,
      { recoverExpiredAccess: false },
    );
    return mapResolve(raw, requested);
  } catch (error) {
    if (isHttpError(error) && (error.status === 404 || error.status === 410)) {
      return null;
    }
    throw error;
  }
});

export { replaceUltaryNicknameInPath } from './replaceUltaryNicknameInPath';
