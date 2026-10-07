'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { FeedGrid, type FeedGridItem } from '@/components/feed/FeedGrid';
import { HashtagResultList } from '@/components/search/HashtagResultList';
import { bffDelete, bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { toFeedDataList } from '@/lib/feed/toFeedData';
import { mapRecentAccounts, mapSearchTags, mapSearchUsers } from '@/lib/search/accounts';
import type { BffEnvelope } from '@/types/api';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { type MockHashtag, type SearchAccount } from '@/lib/mock/search';
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

const PREVIEW_LIMIT = 5;
const COMMIT_LIMIT = 20;
const PREVIEW_DELAY_MS = 400;

function searchType(mode: 'plain' | 'pet' | 'hashtag'): 'USER' | 'MENTION' | 'TAG' {
  if (mode === 'pet') return 'MENTION';
  if (mode === 'hashtag') return 'TAG';
  return 'USER';
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
  const [tagResults, setTagResults] = useState<MockHashtag[]>([]);
  const [resultState, setResultState] = useState<'idle' | 'pending' | 'ready'>('idle');
  const [searching, setSearching] = useState(false);
  /** 엔터로 확정하면 20건. 글자가 바뀌면 미리보기 5건으로 돌아간다 */
  const [committed, setCommitted] = useState(false);
  const [submitTick, setSubmitTick] = useState(0);
  /** 같은 검색어로 태그 그리드에서 돌아오면 목록을 다시 받지 않는다 */
  const loadedSearchKeyRef = useRef('');

  const [hashtagPosts, setHashtagPosts] = useState<FeedGridItem[]>([]);
  const [hashtagState, setHashtagState] = useState<'idle' | 'loading' | 'ready'>('idle');
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
    const q = new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
    if (!q) return;
    setQuery(q);
    setPhase('active');
    if (q.startsWith('#')) setSelectedHashtag(q);
    else setCommitted(true);
  }, []);

  useEffect(() => {
    if (!selectedHashtag) {
      setHashtagPosts([]);
      setHashtagState('idle');
      return;
    }
    const term = selectedHashtag.replace(/^#/, '').trim();
    if (!term) return;

    let cancelled = false;
    setHashtagState('loading');
    bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
      q: term,
      type: 'FEED',
      limit: 20,
    })
      .then((res) => {
        if (cancelled) return;
        const data = isRecord(res.data) ? res.data : {};
        const feeds = Array.isArray(data.feeds) ? data.feeds : [];
        setHashtagPosts(
          toFeedDataList(feeds)
            .filter((feed) => Boolean(feed.images[0]))
            .map((feed) => ({
              id: feed.id,
              imageUrl: feed.images[0],
              isMulti: feed.images.length > 1,
              href: `/posts/${feed.id}`,
            })),
        );
        setHashtagState('ready');
      })
      .catch((err) => {
        console.error('[search] hashtag feeds failed', err);
        if (cancelled) return;
        setHashtagPosts([]);
        setHashtagState('ready');
      });

    return () => {
      cancelled = true;
    };
  }, [selectedHashtag]);

  useEffect(() => {
    if (phase === 'active') {
      inputRef.current?.focus();
    } else {
      setIsInputFocused(false);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active' || selectedHashtag) {
      setSearching(false);
      return;
    }
    const term = parsed.term.trim();
    if (!term) {
      loadedSearchKeyRef.current = '';
      setUserResults([]);
      setTagResults([]);
      setResultState('idle');
      setSearching(false);
      return;
    }

    const limit = committed ? COMMIT_LIMIT : PREVIEW_LIMIT;
    const type = searchType(parsed.mode);
    const requestKey = `${type}:${limit}:${term}:${submitTick}`;
    if (loadedSearchKeyRef.current === requestKey) {
      setSearching(false);
      return;
    }

    let cancelled = false;
    setUserResults([]);
    setTagResults([]);
    setResultState('pending');
    const delay = committed ? 0 : PREVIEW_DELAY_MS;
    const timer = window.setTimeout(() => {
      setSearching(true);
      bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, { q: term, type, limit })
        .then((res) => {
          if (cancelled) return;
          const data = res.data ?? res;
          if (type === 'TAG') setTagResults(mapSearchTags(data));
          else setUserResults(mapSearchUsers(data));
          loadedSearchKeyRef.current = requestKey;
          setResultState('ready');
        })
        .catch((err) => {
          console.error('[search] preview failed', err);
          if (cancelled) return;
          setUserResults([]);
          setTagResults([]);
          setResultState('ready');
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phase, selectedHashtag, parsed.mode, parsed.term, committed, submitTick]);

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
    setCommitted(false);
    setSearching(false);
    setResultState('idle');
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
    setCommitted(false);
  };

  const clearQuery = () => {
    setQuery('');
    setSelectedHashtag(null);
    setCommitted(false);
    setUserResults([]);
    setTagResults([]);
    setResultState('idle');
    setSearching(false);
    inputRef.current?.focus();
  };

  const submitSearch = () => {
    if (!parsed.term.trim() || selectedHashtag) return;
    setCommitted(true);
    setSubmitTick((tick) => tick + 1);
  };

  const selectHashtag = (tag: string) => {
    setSelectedHashtag(tag.startsWith('#') ? tag : `#${tag}`);
  };

  const backFromTagGrid = () => {
    setSelectedHashtag(null);
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
      {showHashtagGrid && selectedHashtag ? (
        <PageHeader
          title={selectedHashtag.startsWith('#') ? selectedHashtag : `#${selectedHashtag}`}
          onBack={backFromTagGrid}
        />
      ) : (
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
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
                  event.preventDefault();
                  submitSearch();
                }}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                aria-label="검색"
              />
              {(searching || (selectedHashtag != null && hashtagState === 'loading')) &&
              query.length > 0 ? (
                <span className={styles.searchSpinner} role="status" aria-label="검색 중" />
              ) : query.length > 0 ? (
                <button
                  type="button"
                  className={styles.clearQueryBtn}
                  aria-label="검색어 지우기"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={clearQuery}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path
                      d="M3 3l8 8M11 3L3 11"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              ) : null}
            </label>
            <button type="button" className={styles.cancelBtn} onClick={cancelSearch}>
              취소
            </button>
          </>
        )}
      </header>
      )}

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

        {showAccountList && resultState === 'ready' ? (
          <div className={styles.searchPanel}>
            {userResults.length === 0 ? (
              <EmptyState
                title="검색 결과가 없어요"
                description="다른 닉네임이나 펫 태그로 다시 검색해 보세요."
              />
            ) : (
              <ul className={styles.accountList}>
                {userResults.map((account) => (
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

        {showHashtagList && resultState === 'ready' ? (
          <div className={styles.searchPanel}>
            {tagResults.length === 0 ? (
              <EmptyState
                title="해시태그가 없어요"
                description="다른 키워드로 검색해 보세요."
              />
            ) : (
              <HashtagResultList
                items={tagResults}
                onSelect={selectHashtag}
                variant="page"
              />
            )}
          </div>
        ) : null}

        {showHashtagGrid ? (
          hashtagState === 'loading' ? (
            <p className={styles.searchStatus}>불러오는 중…</p>
          ) : (
            <FeedGrid
              posts={hashtagPosts}
              emptyTitle="게시물이 없어요"
              emptyDescription="이 해시태그가 달린 게시물이 아직 없어요."
            />
          )
        ) : null}
      </main>

      <FooterMenu />
    </div>
  );
}
