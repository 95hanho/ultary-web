'use client';

import { formatTagPostCount, type MockHashtag } from '@/lib/mock/search';
import clsx from 'clsx';
import styles from './HashtagResultList.module.scss';

type HashtagResultListProps = {
  items: MockHashtag[];
  onSelect: (tag: string) => void;
  variant?: 'page' | 'preview';
  className?: string;
};

/** 해시태그 검색 결과 리스트 — 검색 페이지 / 작성 미리보기 공용 */
export function HashtagResultList({
  items,
  onSelect,
  variant = 'page',
  className,
}: HashtagResultListProps) {
  if (items.length === 0) return null;

  return (
    <ul
      className={clsx(styles.list, variant === 'page' && styles.listPage, className)}
      role="listbox"
      aria-label="해시태그 검색 결과"
    >
      {items.map((item) => (
        <li key={item.tag} className={styles.item} role="option">
          <button
            type="button"
            className={clsx(
              styles.btn,
              variant === 'preview' ? styles.btnPreview : styles.btnPage,
            )}
            onClick={() => onSelect(item.tag)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span
              className={clsx(
                styles.tag,
                variant === 'preview' ? styles.tagPreview : styles.tagPage,
              )}
            >
              {item.tag}
            </span>
            <span className={styles.postCount}>{formatTagPostCount(item.postCount)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
