'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { FeedGrid, type FeedGridItem } from '@/components/feed/FeedGrid';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { toFeedDataList } from '@/lib/feed/toFeedData';
import type { BffEnvelope } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../../search.module.scss';

function hashtagLabel(raw: unknown) {
  if (!isRecord(raw) || typeof raw.hashtag !== 'string') return '';
  const name = raw.hashtag.trim().replace(/^#/, '');
  return name ? `#${name}` : '';
}

/** 태그 검색 그리드. 주소는 /search/tags/{tagId} */
export default function TagGridClient({ tagId }: { tagId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [posts, setPosts] = useState<FeedGridItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const id = Number(tagId);
    if (!Number.isInteger(id) || id <= 0) {
      setState('ready');
      return;
    }

    let cancelled = false;
    setState('loading');

    (async () => {
      try {
        const detailRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.detail, {
          tagId: id,
        });
        if (cancelled) return;
        const label = hashtagLabel(detailRes.data);
        if (!label) {
          setState('ready');
          return;
        }
        setTitle(label);

        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
          q: label.replace(/^#/, ''),
          type: 'FEED',
          limit: 20,
        });
        if (cancelled) return;
        const data = isRecord(res.data) ? res.data : {};
        const feeds = Array.isArray(data.feeds) ? data.feeds : [];
        setPosts(
          toFeedDataList(feeds)
            .filter((feed) => Boolean(feed.images[0]))
            .map((feed) => ({
              id: feed.id,
              imageUrl: feed.images[0],
              isMulti: feed.images.length > 1,
              href: `/posts/${feed.id}`,
            })),
        );
        setState('ready');
      } catch (err) {
        console.error('[search] tag grid failed', err);
        if (!cancelled) setState('ready');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tagId]);

  return (
    <div className={styles.shell}>
      <PageHeader title={title} onBack={() => router.back()} />
      <main className={styles.main}>
        {state === 'loading' ? (
          <p className={styles.searchStatus}>불러오는 중…</p>
        ) : (
          <FeedGrid
            posts={posts}
            emptyTitle="게시물이 없어요"
            emptyDescription="이 해시태그가 달린 게시물이 아직 없어요."
          />
        )}
      </main>
      <FooterMenu />
    </div>
  );
}
