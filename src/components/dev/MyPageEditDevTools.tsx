'use client';

import { DevTestDock } from '@/components/dev/DevTestDock';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import type { BffEnvelope } from '@/types/api';

/**
 * 회원정보 수정 페이지 development 테스트 도구.
 * share §13 — POST /api/test/nickname-cooldown
 */
export function MyPageEditDevTools() {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <DevTestDock
      title="MYPAGE DEV"
      actions={[
        {
          id: 'reset-nickname-cooldown',
          label: '닉네임 변경 제한 초기화',
          onClick: async () => {
            const res = await bffPostJson<
              BffEnvelope<{ userNo?: number; nicknameChangedAt?: string }>
            >(bffEndpoints.test.nicknameCooldown, {});
            console.log('[MyPageEditDevTools] nickname cooldown reset', res.data ?? res);
            return '닉네임 변경 제한을 풀었습니다.';
          },
        },
      ]}
    />
  );
}
