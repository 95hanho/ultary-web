'use client';

import { DevTestDock } from '@/components/dev/DevTestDock';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import type { BffEnvelope } from '@/types/api';

/**
 * 반려동물 관리 development 테스트 도구.
 * share §13 — POST /api/test/pets/:petId/mention-id-cooldown
 */
export function PetsManageDevTools({ petId }: { petId: string | null }) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <DevTestDock
      title="PETS DEV"
      actions={[
        {
          id: 'reset-mention-cooldown',
          label: '멘션 변경 제한 초기화',
          disabled: !petId,
          onClick: async () => {
            if (!petId) return '수정 중인 반려동물을 연 뒤 눌러 주세요.';
            const res = await bffPostJson<
              BffEnvelope<{ petId?: number; mentionIdChangedAt?: string }>
            >(bffEndpoints.test.mentionIdCooldown, { petId });
            console.log('[PetsManageDevTools] mention cooldown reset', res.data ?? res);
            return '멘션 ID 변경 제한을 풀었습니다.';
          },
        },
      ]}
    />
  );
}
