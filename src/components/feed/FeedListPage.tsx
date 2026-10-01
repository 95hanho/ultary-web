'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { FeedList } from '@/components/feed/FeedList';
import type { FeedData } from '@/components/feed/Feed';
import { useEffect } from 'react';
import styles from './FeedListPage.module.scss';

type FeedListPageProps = {
  title: string;
  /** 없으면 브라우저 뒤로 */
  backHref?: string;
  feeds: FeedData[];
  focusId?: string;
  showAuthor?: boolean;
};

/** 스토리 없는 게시글 리스트 페이지 (마이울타리 그리드에서 진입) */
export function FeedListPage({
  title,
  backHref,
  feeds,
  focusId,
  showAuthor = true,
}: FeedListPageProps) {
  useEffect(() => {
    if (!focusId) return;
    document.getElementById(`feed-${focusId}`)?.scrollIntoView({
      block: 'start',
    });
  }, [focusId, feeds]);

  return (
    <div className={styles.shell}>
      <PageHeader title={title} backHref={backHref} />
      <main className={styles.main}>
        <FeedList feeds={feeds} showAuthor={showAuthor} />
      </main>
      <FooterMenu />
    </div>
  );
}
