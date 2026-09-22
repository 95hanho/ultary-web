'use client';

import { Feed, type FeedData } from '@/components/feed/Feed';
import { LoginRequiredModal } from '@/components/auth/LoginRequiredModal';
import { useEffect, useState } from 'react';
import styles from './GuestFeedView.module.scss';

type Props = {
  feed: FeedData;
};

/**
 * 공유 URL 게스트 열람.
 * 최초 로그인 모달 → 닫기 가능 → 이후 모든 액션(오버레이) 시 모달 재표시.
 */
export function GuestFeedView({ feed }: Props) {
  const [loginOpen, setLoginOpen] = useState(true);

  useEffect(() => {
    setLoginOpen(true);
  }, [feed.id]);

  return (
    <div className={styles.shell}>
      <div className={styles.feedWrap} aria-hidden={loginOpen}>
        <Feed {...feed} />
      </div>
      {/* 정적 열람만 — 스와이프·클릭·버튼 전부 차단 후 모달 */}
      <button
        type="button"
        className={styles.blocker}
        aria-label="로그인이 필요합니다"
        onClick={() => setLoginOpen(true)}
      />
      <LoginRequiredModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
