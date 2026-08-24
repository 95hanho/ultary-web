'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { FeedList } from '@/components/feed/FeedList';
import type { FeedData } from '@/components/feed/Feed';
import Image from 'next/image';
import { useEffect } from 'react';
import styles from './FeedListPage.module.scss';

const BOTTOM_BG = '/images/ultary_bg_bt.png';

type FeedListPageProps = {
  title: string;
  backHref: string;
  feeds: FeedData[];
  focusId?: string;
};

/** 스토리 없는 게시글 리스트 페이지 (마이울타리 그리드에서 진입) */
export function FeedListPage({ title, backHref, feeds, focusId }: FeedListPageProps) {
  useEffect(() => {
    if (!focusId) return;
    document.getElementById(`feed-${focusId}`)?.scrollIntoView({
      block: 'start',
    });
  }, [focusId]);

  return (
    <div className={styles.shell}>
      <PageHeader title={title} backHref={backHref} />
      <main className={styles.main}>
        <FeedList feeds={feeds} />
      </main>
      <Image src={BOTTOM_BG} alt="" width={430} height={120} className={styles.bottomBg} />
      <FooterMenu />
    </div>
  );
}
