'use client';

import { useEffect, useRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import styles from './InfiniteFeedFooter.module.scss';

export function InfiniteFeedFooter({
  hasMore,
  loading,
  error,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  error: boolean;
  onLoadMore: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasMore || loading || error) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: '0px 0px 120px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loading, error, onLoadMore]);
  return (
    <div ref={sentinel} className={styles.footer}>
      {loading ? (
        <LoaderCircle
          className={styles.spinner}
          size={20}
          role="status"
          aria-label="게시글 불러오는 중"
        />
      ) : error ? (
        <button type="button" onClick={onLoadMore}>
          불러오지 못했습니다. 다시 시도
        </button>
      ) : !hasMore ? (
        <p>마지막 게시글입니다.</p>
      ) : null}
    </div>
  );
}
