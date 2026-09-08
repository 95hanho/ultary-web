'use client';

import { FeedListPage } from '@/components/feed/FeedListPage';
import { MOCK_SAVED_FEEDS } from '@/lib/mock/feeds';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { useParams } from 'next/navigation';

export default function MyUltarySavedClient() {
  const params = useParams<{ nickname: string; id: string }>();
  const nickname = typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];
  const postId = typeof params.id === 'string' ? params.id : params.id?.[0];

  return (
    <FeedListPage
      title="게시글"
      backHref={myUltaryPath(nickname)}
      feeds={MOCK_SAVED_FEEDS}
      focusId={postId}
    />
  );
}
