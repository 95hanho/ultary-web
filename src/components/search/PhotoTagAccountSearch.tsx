'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import type { SearchAccount, SearchPetChoice } from '@/lib/mock/search';
import { mapPetCandidates } from '@/lib/search/petCandidates';
import type { BffEnvelope } from '@/types/api';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AccountResultList } from './AccountResultList';
import styles from './PhotoTagAccountSearch.module.scss';

const SearchIcon = '/images/icon/Search.svg';

export type PetMentionSelection = {
  petId: number;
  petTag: string;
};

type PhotoTagAccountSearchProps = {
  open: boolean;
  onSelect: (pet: PetMentionSelection) => void;
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

function choiceOf(account: SearchAccount, petTag?: string): SearchPetChoice | null {
  const choices = account.petChoices ?? [];
  if (petTag) return choices.find((choice) => choice.petTag === petTag) ?? null;
  return choices[0] ?? null;
}

/** 사진 태그·스토리 멘션 — 닉네임·펫 멘션 검색 (`GET /main/search?type=PET`) */
export function PhotoTagAccountSearch({
  open,
  onSelect,
  onClose,
}: PhotoTagAccountSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchAccount[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'loading' | 'ready'>('idle');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setSearchState('idle');
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
  const term = parsed.mode === 'hashtag' ? '' : parsed.term.trim().replace(/^@/, '');

  useEffect(() => {
    if (!open || !term) {
      setResults([]);
      setSearchState('idle');
      return;
    }

    let cancelled = false;
    setSearchState('loading');
    const timer = window.setTimeout(() => {
      const petsPromise = bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
        q: term,
        type: 'PET',
      });
      const usersPromise = bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
        q: term,
        type: 'USER',
      }).catch(() => null);

      Promise.all([petsPromise, usersPromise])
        .then(([pets, users]) => {
          if (cancelled) return;
          setResults(mapPetCandidates(pets.data ?? pets, users?.data ?? users));
          setSearchState('ready');
        })
        .catch((err) => {
          console.error('[pet-search] failed', err);
          if (cancelled) return;
          setResults([]);
          setSearchState('ready');
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, term]);

  const nickHighlight = parsed.mode === 'plain' ? parsed.term : '';
  const petHighlight =
    parsed.mode === 'pet' ? `@${parsed.term}` : parsed.mode === 'plain' ? parsed.term : '';

  const pick = (account: SearchAccount, petTag?: string) => {
    const choice = choiceOf(account, petTag);
    if (!choice) return;
    onSelect({ petId: choice.petId, petTag: choice.petTag });
  };

  if (!mounted || !open) return null;

  const showResults = term.length > 0 && searchState === 'ready' && results.length > 0;
  const showEmpty = term.length > 0 && searchState === 'ready' && results.length === 0;

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
          {!term ? <p className={styles.hint}>닉네임 또는 펫 멘션으로 검색해 주세요.</p> : null}
          {searchState === 'loading' ? <p className={styles.hint}>검색 중…</p> : null}
          {showEmpty ? <p className={styles.hint}>검색 결과가 없습니다.</p> : null}
          {showResults ? (
            <AccountResultList
              accounts={results}
              highlightQuery={nickHighlight}
              petQuery={petHighlight}
              onSelectNickname={(account) => pick(account)}
              onSelectPetTag={(account, petTag) => pick(account, petTag)}
            />
          ) : null}
        </main>

        <FooterMenu />
      </div>
    </div>,
    document.body,
  );
}
