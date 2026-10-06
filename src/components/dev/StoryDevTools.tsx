'use client';

import { useDevTestActions } from '@/components/dev/DevTestProvider';
import { bffDelete } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import type { BffEnvelope } from '@/types/api';

type Props = {
  /** 읽음 초기화 후 (목록 다시 불러오기 등) */
  onStoryViewsCleared?: () => void | Promise<void>;
};

/**
 * 스토리 페이지 development 테스트 도구.
 * share §13 — DELETE /api/test/story-views
 * 초기화 후 콜백에서 이전 페이지로 돌아가는 것을 권장 (현재 스토리 재읽음 방지).
 */
export function StoryDevTools({ onStoryViewsCleared }: Props) {
  useDevTestActions('story', 'STORY DEV', [
    {
      id: 'clear-story-views',
      label: '내 스토리 읽음 초기화',
      onClick: async () => {
        const res = await bffDelete<BffEnvelope<{ deletedCount?: number }>>(
          bffEndpoints.test.storyViews,
        );
        const count = res.data?.deletedCount;
        console.log('[StoryDevTools] story-views cleared', count ?? res);
        await onStoryViewsCleared?.();
      },
    },
  ]);
  return null;
}
