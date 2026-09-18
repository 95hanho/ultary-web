'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { FeedGrid, type FeedGridItem } from '@/components/feed/FeedGrid';
import { MOCK_HOME_FEEDS } from '@/lib/mock/feeds';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import styles from './tagged.module.scss';

type TaggedClientProps = {
  nickname: string;
};

/** 마이울타리 — 태그된 게시물 */
export default function TaggedClient({ nickname }: TaggedClientProps) {
  const basePath = myUltaryPath(nickname);
  const posts: FeedGridItem[] = MOCK_HOME_FEEDS.slice(0, 6).map((feed) => ({
    id: `tagged-${feed.id}`,
    imageUrl: feed.images[0] ?? '/images/mock/post_ex.jpg',
    isMulti: feed.images.length > 1,
    href: `${basePath}/posts/${feed.id}`,
  }));

  return (
    <div className={styles.shell}>
      <PageHeader title="태그됨" backHref={basePath} />
      <main className={styles.main}>
        {posts.length === 0 ? (
          <EmptyState
            title="태그된 게시물이 없어요"
            description="다른 사람의 게시물에 태그되면 여기에 모여요."
          />
        ) : (
          <FeedGrid posts={posts} />
        )}
      </main>
      <FooterMenu />
    </div>
  );
}
