'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { FeedGrid } from '@/components/feed/FeedGrid';
import { MOCK_RECOMMENDED_FEEDS } from '@/lib/mock/feeds';
import { MOCK_HASHTAGS, MOCK_SEARCH_ACCOUNTS, type SearchAccount } from '@/lib/mock/search';
import { highlightMatch, sortPetTagsByMatch } from '@/lib/search/highlight';
import clsx from 'clsx';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './search.module.scss';

const SearchIcon = '/images/icon/Search.svg';

const RECOMMENDED_POSTS = MOCK_RECOMMENDED_FEEDS.map((feed) => ({
  id: feed.id,
  imageUrl: feed.images[0] ?? '/images/mock/post_ex.jpg',
  isMulti: feed.images.length > 1,
  href: `/myultary/posts/${feed.id}`,
}));

const HASHTAG_RESULT_POSTS = MOCK_RECOMMENDED_FEEDS.map((feed) => ({
  id: `tag-${feed.id}`,
  imageUrl: feed.images[0] ?? '/images/mock/post_ex.jpg',
  isMulti: true,
  href: `/myultary/posts/${feed.id}`,
}));

type SearchPhase = 'idle' | 'active';

function parseQuery(raw: string): {
  mode: 'plain' | 'pet' | 'hashtag';
  term: string;
} {
  const value = raw.trimStart();
  if (value.startsWith('#')) return { mode: 'hashtag', term: value.slice(1) };
  if (value.startsWith('@')) return { mode: 'pet', term: value.slice(1) };
  return { mode: 'plain', term: value };
}

function filterAccounts(mode: 'plain' | 'pet', term: string): SearchAccount[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];

  return MOCK_SEARCH_ACCOUNTS.filter((acc) => {
    if (mode === 'pet') {
      return acc.petTags.some((tag) => tag.toLowerCase().includes(`@${q}`) || tag.toLowerCase().includes(q));
    }
    const nickHit = acc.nickname.toLowerCase().includes(q);
    const tagHit = acc.petTags.some((tag) => tag.toLowerCase().includes(q));
    return nickHit || tagHit;
  });
}

function filterHashtags(term: string): string[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return MOCK_HASHTAGS.filter((tag) => tag.toLowerCase().includes(q) || tag.toLowerCase().includes(`#${q}`));
}

function AccountRow({
  account,
  highlightQuery,
  petQuery,
}: {
  account: SearchAccount;
  highlightQuery: string;
  petQuery: string;
}) {
  const tags = sortPetTagsByMatch(account.petTags, petQuery || highlightQuery);

  return (
    <li className={styles.accountItem}>
      <button type="button" className={styles.accountBtn}>
        <span className={styles.accountImageWrap}>
          <Image
            src={account.imageUrl}
            alt=""
            width={47}
            height={47}
            className={styles.accountImage}
          />
        </span>
        <span className={styles.accountText}>
          <span className={styles.accountNick}>
            {highlightMatch(account.nickname, highlightQuery, styles.hit)}
          </span>
          <span className={styles.accountTags}>
            {tags.map((tag, i) => (
              <span key={tag}>
                {i > 0 ? ' ' : null}
                {highlightMatch(tag, petQuery || highlightQuery, styles.hit)}
              </span>
            ))}
          </span>
        </span>
      </button>
    </li>
  );
}

/** 검색 페이지 */
export default function SearchClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [query, setQuery] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [recentAccounts, setRecentAccounts] = useState<SearchAccount[]>([
    MOCK_SEARCH_ACCOUNTS[0],
    MOCK_SEARCH_ACCOUNTS[0],
  ]);

  const [isInputFocused, setIsInputFocused] = useState(false);

  const parsed = useMemo(() => parseQuery(query), [query]);

  useEffect(() => {
    if (phase === 'active') {
      inputRef.current?.focus();
    } else {
      setIsInputFocused(false);
    }
  }, [phase]);

  const accountResults = useMemo(() => {
    if (phase !== 'active' || selectedHashtag) return [];
    if (parsed.mode === 'hashtag') return [];
    if (!parsed.term.trim()) return [];
    return filterAccounts(parsed.mode === 'pet' ? 'pet' : 'plain', parsed.term);
  }, [phase, parsed, selectedHashtag]);

  const hashtagResults = useMemo(() => {
    if (phase !== 'active' || selectedHashtag) return [];
    if (parsed.mode !== 'hashtag') return [];
    return filterHashtags(parsed.term);
  }, [phase, parsed, selectedHashtag]);

  const showRecent =
    phase === 'active' && !selectedHashtag && query.trim() === '';

  const showAccountList =
    phase === 'active' &&
    !selectedHashtag &&
    parsed.mode !== 'hashtag' &&
    parsed.term.trim().length > 0;

  const showHashtagList =
    phase === 'active' &&
    !selectedHashtag &&
    parsed.mode === 'hashtag' &&
    parsed.term.trim().length > 0;

  const showHashtagGrid = phase === 'active' && !!selectedHashtag;

  const openSearch = () => {
    setPhase('active');
    setSelectedHashtag(null);
  };

  const cancelSearch = () => {
    setPhase('idle');
    setQuery('');
    setSelectedHashtag(null);
  };

  const clearRecent = () => {
    setRecentAccounts([]);
  };

  const onChangeQuery = (value: string) => {
    setQuery(value);
    setSelectedHashtag(null);
  };

  const selectHashtag = (tag: string) => {
    setSelectedHashtag(tag);
    setQuery(tag.startsWith('#') ? tag : `#${tag}`);
  };

  const nickHighlight = parsed.mode === 'plain' ? parsed.term : '';
  const petHighlight =
    parsed.mode === 'pet'
      ? `@${parsed.term}`
      : parsed.mode === 'plain'
        ? parsed.term
        : '';

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        {phase === 'idle' ? (
          <button type="button" className={styles.searchBarIdle} onClick={openSearch}>
            <Image src={SearchIcon} alt="" width={20} height={20} className={styles.searchIcon} />
            <span className={styles.searchPlaceholder}>검색</span>
          </button>
        ) : (
          <>
            <label
              className={clsx(styles.searchBar, isInputFocused && styles.searchBarFocus)}
            >
              <Image src={SearchIcon} alt="" width={20} height={20} className={styles.searchIcon} />
              <input
                ref={inputRef}
                type="search"
                className={styles.searchInput}
                placeholder="검색"
                value={query}
                onChange={(e) => onChangeQuery(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                aria-label="검색"
              />
            </label>
            <button type="button" className={styles.cancelBtn} onClick={cancelSearch}>
              취소
            </button>
          </>
        )}
      </header>

      <main className={styles.main}>
        {phase === 'idle' ? <FeedGrid posts={RECOMMENDED_POSTS} /> : null}

        {showRecent ? (
          <div className={styles.searchPanel}>
            <div className={styles.recentHeader}>
              <span className={styles.recentTitle}>최근 검색 항목</span>
              <button type="button" className={styles.clearAllBtn} onClick={clearRecent}>
                모두 지우기
              </button>
            </div>
            <ul className={styles.accountList}>
              {recentAccounts.map((account, i) => (
                <AccountRow
                  key={`${account.id}-${i}`}
                  account={account}
                  highlightQuery=""
                  petQuery=""
                />
              ))}
            </ul>
          </div>
        ) : null}

        {showAccountList ? (
          <div className={styles.searchPanel}>
            <ul className={styles.accountList}>
              {accountResults.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  highlightQuery={nickHighlight}
                  petQuery={petHighlight}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {showHashtagList ? (
          <div className={styles.searchPanel}>
            <ul className={styles.hashtagList}>
              {hashtagResults.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    className={styles.hashtagItem}
                    onClick={() => selectHashtag(tag)}
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showHashtagGrid ? <FeedGrid posts={HASHTAG_RESULT_POSTS} /> : null}
      </main>

      <FooterMenu />
    </div>
  );
}
