'use client';

import { FeedListPage } from '@/components/feed/FeedListPage';
import type { FeedData } from '@/components/feed/Feed';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedData } from '@/lib/feed/toFeedData';
import type { BffEnvelope } from '@/types/api';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/** 알림에서 들어오는 게시글 단건. 제목 없이 뒤로가기만 둔다. */
export default function PostClient() {
  const params = useParams<{ id: string }>();
  const postId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [feeds, setFeeds] = useState<FeedData[]>([]);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.feeds.detail, {
          feedId: postId,
        });
        if (!cancelled) setFeeds([toFeedData(res.data, postId)]);
      } catch (err) {
        console.error('[post] load failed', err);
        if (!cancelled) setFeeds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  return <FeedListPage title="" feeds={feeds} />;
}
