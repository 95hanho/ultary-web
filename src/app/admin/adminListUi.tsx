'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { API_LIMIT, STATUS_TONE } from './adminData';
import styles from './admin.module.scss';

const ROW_FALLBACK = 78;

export function badgeClass(status: string) {
  const tone = STATUS_TONE[status];
  return tone ? `${styles.badge} ${styles[tone]}` : styles.badge;
}

export function Pager({
  page,
  totalCount,
  pageSize,
  hasNext,
  disabled,
  onPrev,
  onNext,
}: {
  page: number;
  totalCount: number | null;
  pageSize: number;
  hasNext: boolean;
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={styles.pager}>
      <button type="button" className={styles.pageButton} onClick={onPrev} disabled={disabled || page === 0}>
        이전
      </button>
      <span className={styles.pageLabel}>{pageFraction(page, totalCount, pageSize)}</span>
      <button type="button" className={styles.pageButton} onClick={onNext} disabled={disabled || !hasNext}>
        다음
      </button>
    </div>
  );
}

function pageFraction(page: number, totalCount: number | null, pageSize: number) {
  if (totalCount == null || pageSize < 1) return String(page + 1);
  if (totalCount === 0) return '0/0';
  return `${page + 1}/${Math.ceil(totalCount / pageSize)}`;
}

export function useFitCount(ref: RefObject<HTMLDivElement | null>, itemCount: number) {
  const [count, setCount] = useState(8);
  const rowHeight = useRef(ROW_FALLBACK);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const sample = el.querySelector('tbody tr, li');
      if (sample) {
        const height = sample.getBoundingClientRect().height;
        if (height > 0) rowHeight.current = height;
      }
      const headerHeight = el.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      const next = Math.max(1, Math.min(API_LIMIT, Math.floor((el.clientHeight - headerHeight) / rowHeight.current)));
      setCount((prev) => (prev === next ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, itemCount]);

  return count;
}
