'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { filterMockHashtags } from '@/lib/mock/search';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HashtagResultList } from './HashtagResultList';
import styles from './TagSearchPanel.module.scss';

const SearchIcon = '/images/icon/Search.svg';

type TagSearchPanelProps = {
  open: boolean;
  /** `#` 포함/미포함 모두 가능 */
  initialQuery?: string;
  onSelect: (tag: string) => void;
  onClose: () => void;
};

/** 작성 화면 전용 — 검색 페이지 태그검색과 동일한 UI 모달 */
export function TagSearchPanel({
  open,
  initialQuery = '',
  onSelect,
  onClose,
}: TagSearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const normalized = initialQuery.startsWith('#')
      ? initialQuery
      : initialQuery
        ? `#${initialQuery}`
        : '#';
    setQuery(normalized);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prev;
    };
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const term = useMemo(() => {
    const value = query.trimStart();
    return value.startsWith('#') ? value.slice(1) : value;
  }, [query]);

  const results = useMemo(() => filterMockHashtags(term), [term]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className={styles.shell} role="dialog" aria-modal="true" aria-label="태그 검색">
      <div className={styles.inner}>
        <header className={styles.header}>
          <label className={styles.searchBar}>
            <Image src={SearchIcon} alt="" width={20} height={20} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="search"
              className={styles.searchInput}
              value={query}
              onChange={(e) => {
                const next = e.target.value;
                setQuery(next.startsWith('#') || next === '' ? next : `#${next}`);
              }}
              aria-label="태그 검색"
              placeholder="#태그"
            />
          </label>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            취소
          </button>
        </header>

        <main className={styles.main}>
          {term.trim().length > 0 ? (
            <HashtagResultList items={results} onSelect={onSelect} variant="page" />
          ) : null}
        </main>

        <FooterMenu />
      </div>
    </div>,
    document.body,
  );
}
