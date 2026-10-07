'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { FeedGrid, type FeedGridItem } from '@/components/feed/FeedGrid';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { mapFeedGrid } from '@/lib/myultary/fromApi';
import type { BffEnvelope } from '@/types/api';
import { useEffect, useState } from 'react';
import styles from './saved.module.scss';

/** 설정 > 저장한 게시글. 나만 보는 저장 */
export default function SavedPostsClient() {
  const [posts, setPosts] = useState<FeedGridItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.savedFeeds, {
          limit: 50,
        });
        if (cancelled) return;
        setPosts(mapFeedGrid(res.data, (id) => `/posts/${id}`));
      } catch (err) {
        console.error('[settings] saved feeds failed', err);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.shell}>
      <PageHeader title="저장한 게시글" backHref="/settings" />
      <main className={styles.main}>
        {ready ? (
          <FeedGrid posts={posts} emptyTitle="저장한 게시글이 없어요" />
        ) : null}
      </main>
      <FooterMenu />
    </div>
  );
}
