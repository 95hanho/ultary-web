'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import {
  filterMockAccounts,
  MOCK_SEARCH_ACCOUNTS,
  type SearchAccount,
} from '@/lib/mock/search';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AccountResultList } from './AccountResultList';
import styles from './PhotoTagAccountSearch.module.scss';

const SearchIcon = '/images/icon/Search.svg';

type PhotoTagAccountSearchProps = {
  open: boolean;
  /** 선택 시 펫언급명 (`@…`) */
  onSelect: (petTag: string) => void;
  onClose: () => void;
};

function parseAccountQuery(raw: string): {
  mode: 'plain' | 'pet' | 'hashtag' | 'empty';
  term: string;
} {
  const value = raw.trimStart();
  if (!value.trim()) return { mode: 'empty', term: '' };
  if (value.startsWith('#')) return { mode: 'hashtag', term: value.slice(1) };
  if (value.startsWith('@')) return { mode: 'pet', term: value.slice(1) };
  return { mode: 'plain', term: value };
}

function firstPetTag(account: SearchAccount): string | null {
  const first = account.petTags[0];
  if (!first) return null;
  return first.startsWith('@') ? first : `@${first}`;
}

function normalizePetTag(tag: string): string {
  return tag.startsWith('@') ? tag : `@${tag}`;
}

/** 사진 태그용 — 닉네임·펫언급만 검색 (해시태그 제외) */
export function PhotoTagAccountSearch({
  open,
  onSelect,
  onClose,
}: PhotoTagAccountSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<SearchAccount[]>([
    MOCK_SEARCH_ACCOUNTS[0],
    MOCK_SEARCH_ACCOUNTS[0],
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const parsed = useMemo(() => parseAccountQuery(query), [query]);

  const results = useMemo(() => {
    if (parsed.mode === 'empty' || parsed.mode === 'hashtag') return [];
    return filterMockAccounts(parsed.term, parsed.mode === 'pet' ? 'pet' : 'plain');
  }, [parsed]);

  const showRecent = parsed.mode === 'empty' && recent.length > 0;
  const showResults =
    parsed.mode !== 'empty' && parsed.mode !== 'hashtag' && parsed.term.trim().length > 0;

  const nickHighlight = parsed.mode === 'plain' ? parsed.term : '';
  const petHighlight =
    parsed.mode === 'pet'
      ? `@${parsed.term}`
      : parsed.mode === 'plain'
        ? parsed.term
        : '';

  const pickNickname = (account: SearchAccount) => {
    const pet = firstPetTag(account);
    if (!pet) return;
    onSelect(pet);
  };

  const pickPet = (_account: SearchAccount, petTag: string) => {
    onSelect(normalizePetTag(petTag));
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className={styles.shell} role="dialog" aria-modal="true" aria-label="사진 태그 검색">
      <div className={styles.inner}>
        <header className={styles.header}>
          <label className={styles.searchBar}>
            <Image src={SearchIcon} alt="" width={20} height={20} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="search"
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="닉네임 또는 펫언급 검색"
              placeholder="검색"
            />
          </label>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            취소
          </button>
        </header>

        <main className={styles.main}>
          {showRecent ? (
            <>
              <div className={styles.recentHeader}>
                <span className={styles.recentTitle}>최근 태그</span>
                <button
                  type="button"
                  className={styles.clearAllBtn}
                  onClick={() => setRecent([])}
                >
                  모두 지우기
                </button>
              </div>
              <AccountResultList
                accounts={recent}
                highlightQuery=""
                petQuery=""
                onSelectNickname={pickNickname}
                onSelectPetTag={pickPet}
              />
            </>
          ) : null}

          {showResults ? (
            <AccountResultList
              accounts={results}
              highlightQuery={nickHighlight}
              petQuery={petHighlight}
              onSelectNickname={pickNickname}
              onSelectPetTag={pickPet}
            />
          ) : null}
        </main>

        <FooterMenu />
      </div>
    </div>,
    document.body,
  );
}
