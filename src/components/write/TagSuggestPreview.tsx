'use client';

import { HashtagResultList } from '@/components/search/HashtagResultList';
import { filterMockHashtags, type MockHashtag } from '@/lib/mock/search';
import Image from 'next/image';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './TagSuggestPreview.module.scss';

const SearchIcon = '/images/icon/Search.svg';

const PREVIEW_WIDTH = 190;
const PREVIEW_GAP = 6;
const ESTIMATED_HEIGHT = 220;

type TagSuggestPreviewProps = {
  open: boolean;
  /** `#` 포함 표시용 */
  queryLabel: string;
  term: string;
  anchor: { top: number; left: number; bottom: number } | null;
  onSelect: (tag: string) => void;
  onOpenSearch: () => void;
  onClose: () => void;
};

/** 작성 중 `#태그` 입력 시 캐럿 근처 미리보기 */
export function TagSuggestPreview({
  open,
  queryLabel,
  term,
  anchor,
  onSelect,
  onOpenSearch,
  onClose,
}: TagSuggestPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const items: MockHashtag[] = useMemo(() => filterMockHashtags(term), [term]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setCoords(null);
      return;
    }

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - anchor.bottom;
    const placeAbove = spaceBelow < ESTIMATED_HEIGHT && anchor.top > spaceBelow;

    const measured = wrapRef.current?.offsetHeight ?? ESTIMATED_HEIGHT;
    let top = placeAbove ? anchor.top - measured - PREVIEW_GAP : anchor.bottom + PREVIEW_GAP;
    let left = Math.min(Math.max(8, anchor.left), vw - PREVIEW_WIDTH - 8);

    if (top < 8) top = 8;
    if (top + measured > vh - 8) top = Math.max(8, vh - measured - 8);

    setCoords({ top, left });
  }, [open, anchor, items.length, queryLabel]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (wrapRef.current && target && !wrapRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open, onClose]);

  if (!mounted || !open || !anchor) return null;

  const label = queryLabel.startsWith('#') ? queryLabel : `#${queryLabel}`;

  return createPortal(
    <div
      ref={wrapRef}
      className={styles.wrap}
      style={{
        top: coords?.top ?? anchor.bottom + PREVIEW_GAP,
        left: coords?.left ?? anchor.left,
        visibility: coords ? 'visible' : 'hidden',
      }}
      role="dialog"
      aria-label="태그 미리보기"
    >
      <div className={styles.searchWrap}>
        <button type="button" className={styles.searchBar} onClick={onOpenSearch}>
          <Image src={SearchIcon} alt="" width={14} height={14} className={styles.searchIcon} />
          <span className={styles.searchText}>{label}</span>
        </button>
      </div>
      {items.length > 0 ? (
        <div className={styles.list}>
          <HashtagResultList items={items} onSelect={onSelect} variant="preview" />
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
