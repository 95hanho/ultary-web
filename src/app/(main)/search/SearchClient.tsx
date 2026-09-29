'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { FeedGrid, type FeedGridItem } from '@/components/feed/FeedGrid';
import { HashtagResultList } from '@/components/search/HashtagResultList';
import { bffDelete, bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedDataList } from '@/lib/feed/toFeedData';
import { mapRecentAccounts, mapSearchUsers } from '@/lib/search/accounts';
import { MOCK_RECOMMENDED_FEEDS } from '@/lib/mock/feeds';
import type { BffEnvelope } from '@/types/api';
import { OTHER_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import {
  filterMockHashtags,
  MOCK_SEARCH_ACCOUNTS,
  type MockHashtag,
  type SearchAccount,
} from '@/lib/mock/search';
import { highlightMatch, sortPetTagsByMatch } from '@/lib/search/highlight';
import clsx from 'clsx';
import { MediaImage } from '@/components/common/MediaImage';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import styles from './search.module.scss';

const SearchIcon = '/images/icon/Search.svg';

/** API 오기 전 회색 칸. 이미지는 넣지 않는다 */
const RECOMMENDED_PLACEHOLDERS: FeedGridItem[] = Array.from({ length: 9 }, (_, i) => ({
  id: `recommended-placeholder-${i}`,
}));

const HASHTAG_RESULT_POSTS = MOCK_RECOMMENDED_FEEDS.map((feed) => ({
  id: `tag-${feed.id}`,
  imageUrl: feed.images[0] ?? '/images/mock/post.jpg',
  isMulti: true,
  href: `${myUltaryPath(OTHER_NICKNAME)}/posts/${feed.id}`,
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

function AccountRow({
  account,
  highlightQuery,
  petQuery,
  onEnter,
}: {
  account: SearchAccount;
  highlightQuery: string;
  petQuery: string;
  onEnter: (account: SearchAccount) => void;
}) {
  const tags = sortPetTagsByMatch(account.petTags, petQuery || highlightQuery);

  return (
    <li className={styles.accountItem}>
      <Link
        href={myUltaryPath(account.nickname)}
        className={styles.accountBtn}
        onClick={(event) => {
          if (account.userNo == null) return;
          event.preventDefault();
          onEnter(account);
        }}
      >
        <span className={styles.accountImageWrap}>
          <MediaImage
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
      </Link>
    </li>
  );
}

/** 검색 페이지 */
export default function SearchClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [query, setQuery] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [recentAccounts, setRecentAccounts] = useState<SearchAccount[]>([]);
  const [userResults, setUserResults] = useState<SearchAccount[]>([]);
  const [userSearchState, setUserSearchState] = useState<'idle' | 'loading' | 'ready'>(
    'idle',
  );

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recommendedPosts, setRecommendedPosts] = useState<FeedGridItem[]>(
    RECOMMENDED_PLACEHOLDERS,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(
          bffEndpoints.main.searchRecommended,
          { limit: 10 },
        );
        const grid: FeedGridItem[] = toFeedDataList(res.data ?? res)
          .filter((feed) => Boolean(feed.images[0]))
          .map((feed) => ({
            id: feed.id,
            imageUrl: feed.images[0],
            isMulti: feed.images.length > 1,
            href: `${myUltaryPath(feed.nickname)}/posts/${feed.id}`,
          }));
        if (cancelled) return;
        setRecommendedPosts(grid);
      } catch (err) {
        console.error('[search] recommended failed', err);
        if (!cancelled) setRecommendedPosts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const parsed = useMemo(() => parseQuery(query), [query]);

  useEffect(() => {
    if (phase === 'active') {
      inputRef.current?.focus();
    } else {
      setIsInputFocused(false);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active' || selectedHashtag || parsed.mode !== 'plain') {
      setUserResults([]);
      setUserSearchState('idle');
      return;
    }
    const term = parsed.term.trim();
    if (!term) {
      setUserResults([]);
      setUserSearchState('idle');
      return;
    }

    let cancelled = false;
    setUserSearchState('loading');
    const timer = window.setTimeout(() => {
      bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
        q: term,
        type: 'USER',
      })
        .then((res) => {
          if (cancelled) return;
          setUserResults(mapSearchUsers(res.data ?? res));
          setUserSearchState('ready');
        })
        .catch((err) => {
          console.error('[search] users failed', err);
          if (cancelled) return;
          setUserResults([]);
          setUserSearchState('ready');
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, selectedHashtag, parsed.mode, parsed.term]);

  const accountResults = useMemo(() => {
    if (phase !== 'active' || selectedHashtag) return [];
    if (parsed.mode === 'hashtag' || !parsed.term.trim()) return [];
    if (parsed.mode === 'pet') return filterAccounts('pet', parsed.term);
    return userResults;
  }, [phase, parsed, selectedHashtag, userResults]);

  const hashtagResults: MockHashtag[] = useMemo(() => {
    if (phase !== 'active' || selectedHashtag) return [];
    if (parsed.mode !== 'hashtag') return [];
    return filterMockHashtags(parsed.term);
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

  async function loadRecent() {
    try {
      const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.searchRecent);
      setRecentAccounts(mapRecentAccounts(res.data ?? res));
    } catch (err) {
      console.error('[search] recent failed', err);
      setRecentAccounts([]);
    }
  }

  async function enterUltary(account: SearchAccount) {
    const href = myUltaryPath(account.nickname);
    if (account.userNo != null) {
      try {
        await bffPostJson(bffEndpoints.main.searchRecent, {
          targetUserNo: account.userNo,
        });
      } catch (err) {
        console.error('[search] recent save failed', err);
      }
    }
    router.push(href);
  }

  const openSearch = () => {
    setPhase('active');
    setSelectedHashtag(null);
    void loadRecent();
  };

  const cancelSearch = () => {
    setPhase('idle');
    setQuery('');
    setSelectedHashtag(null);
  };

  async function clearRecent() {
    try {
      await bffDelete(bffEndpoints.main.searchRecent);
      setRecentAccounts([]);
    } catch (err) {
      console.error('[search] recent clear failed', err);
    }
  }

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
        {phase === 'idle' ? <FeedGrid posts={recommendedPosts} /> : null}

        {showRecent && recentAccounts.length > 0 ? (
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
                  onEnter={enterUltary}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {showAccountList ? (
          <div className={styles.searchPanel}>
            {parsed.mode === 'plain' && userSearchState === 'loading' ? null : accountResults.length === 0 ? (
              <EmptyState
                title="검색 결과가 없어요"
                description="다른 닉네임이나 펫 태그로 다시 검색해 보세요."
              />
            ) : (
              <ul className={styles.accountList}>
                {accountResults.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    highlightQuery={nickHighlight}
                    petQuery={petHighlight}
                    onEnter={enterUltary}
                  />
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {showHashtagList ? (
          <div className={styles.searchPanel}>
            {hashtagResults.length === 0 ? (
              <EmptyState
                title="해시태그가 없어요"
                description="다른 키워드로 검색해 보세요."
              />
            ) : (
              <HashtagResultList
                items={hashtagResults}
                onSelect={selectHashtag}
                variant="page"
              />
            )}
          </div>
        ) : null}

        {showHashtagGrid ? (
          <FeedGrid
            posts={HASHTAG_RESULT_POSTS}
            emptyTitle="게시물이 없어요"
            emptyDescription="이 해시태그가 달린 게시물이 아직 없어요."
          />
        ) : null}
      </main>

      <FooterMenu />
    </div>
  );
}
