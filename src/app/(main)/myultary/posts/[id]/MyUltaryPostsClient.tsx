'use client';

import { FeedListPage } from '@/components/feed/FeedListPage';
import { MOCK_MY_FEEDS } from '@/lib/mock/feeds';
import { useParams } from 'next/navigation';

export default function MyUltaryPostsClient() {
  const params = useParams<{ id: string }>();
  const postId = typeof params.id === 'string' ? params.id : params.id?.[0];

  return (
    <FeedListPage
      title="게시글"
      backHref="/myultary"
      feeds={MOCK_MY_FEEDS}
      focusId={postId}
    />
  );
}
