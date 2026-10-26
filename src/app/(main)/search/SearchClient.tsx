'use client';
import { useResettableState } from '@/lib/react/useResettableState';

import { PageLoadError } from '@/components/common/PageLoadError';

import { FooterMenu } from '@/components/common/FooterMenu';
import { FeedGrid, type FeedGridItem } from '@/components/feed/FeedGrid';
import { HashtagResultList } from '@/components/search/HashtagResultList';
import { bffDelete, bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { toFeedDataList } from '@/lib/feed/toFeedData';
import {
  mapRecentItems,
  mapSearchTags,
  mapSearchUsers,
  type RecentSearchItem,
  type RecentSearchTag,
} from '@/lib/search/accounts';
import type { BffEnvelope } from '@/types/api';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { formatTagPostCount, type MockHashtag, type SearchAccount } from '@/lib/mock/search';
import { highlightMatch, sortPetTagsByMatch } from '@/lib/search/highlight';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';
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

/** 검색 목록 주소. 태그 그리드에서 뒤로가면 이 주소로 같은 검색을 다시 받는다 */
function searchListPath(active: boolean, query: string, committed: boolean) {
  const trimmed = query.trim();
  if (!active || !trimmed) return '/search';
  const params = new URLSearchParams();
  params.set('q', trimmed);
  if (committed) params.set('commit', '1');
  return `/search?${params.toString()}`;
}

function replaceSearchUrl(next: string) {
  if (window.location.pathname !== '/search') return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === next) return;
  const state =
    window.history.state && typeof window.history.state === 'object' ? window.history.state : {};
  window.history.replaceState(state, '', next);
}

function searchType(mode: 'plain' | 'pet' | 'hashtag'): 'USER' | 'MENTION' | 'TAG' {
  if (mode === 'pet') return 'MENTION';
  if (mode === 'hashtag') return 'TAG';
  return 'USER';
}

function RemoveRecentButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      className={styles.removeRecentBtn}
      aria-label={`${label} 최근 검색 삭제`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onRemove}
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
  );
}

function AccountRow({
  account,
  highlightQuery,
  petQuery,
  onEnter,
  onRemove,
}: {
  account: SearchAccount;
  highlightQuery: string;
  petQuery: string;
  onEnter: (account: SearchAccount, href?: string) => void;
  onRemove?: () => void;
}) {
  const tags = sortPetTagsByMatch(account.petTags, petQuery || highlightQuery);
  const story: StoryStatus = account.hasStory ? (account.hasUnviewed ? 'unread' : 'read') : 'none';
  const storyHref =
    story !== 'none' && account.userNo != null
      ? `/stories?${new URLSearchParams({ userNo: String(account.userNo), nickname: account.nickname, single: '1' }).toString()}`
      : null;
  const profile = (
    <Profile
      imageUrl={account.imageUrl}
      size={45}
      story={story}
      className={styles.accountProfile}
    />
  );

  return (
    <li className={styles.accountItem}>
      <div className={styles.accountInfo}>
        <div className={styles.accountImageArea}>
          {storyHref ? (
            <Link
              href={storyHref}
              className={styles.accountImageWrap}
              aria-label={`${account.nickname} 스토리 보기`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault();
                onEnter(account, storyHref);
              }}
            >
              {profile}
            </Link>
          ) : (
            <span
              className={styles.accountImageWrap}
              onMouseDown={(event) => event.preventDefault()}
            >
              {profile}
            </span>
          )}
        </div>
        <Link
          href={myUltaryPath(account.nickname)}
          className={styles.accountText}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            if (account.userNo == null) return;
            event.preventDefault();
            onEnter(account);
          }}
        >
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
        </Link>
      </div>
      {onRemove ? <RemoveRecentButton label={account.nickname} onRemove={onRemove} /> : null}
    </li>
  );
}

function RecentTagRow({
  item,
  onEnter,
  onRemove,
}: {
  item: RecentSearchTag;
  onEnter: (item: RecentSearchTag) => void;
  onRemove: () => void;
}) {
  return (
    <li className={styles.accountItem}>
      <button
        type="button"
        className={styles.recentTagBtn}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onEnter(item)}
      >
        <span className={styles.recentTagLabel}>{item.tag}</span>
        <span className={styles.recentPostCount}>{formatTagPostCount(item.postCount)}</span>
      </button>
      <RemoveRecentButton label={item.tag} onRemove={onRemove} />
    </li>
  );
}

/** 검색 페이지 */
export default function SearchClient() {
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<SearchPhase>(searchParams.get('q') ? 'active' : 'idle');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const parsed = useMemo(() => parseQuery(query), [query]);
  const [committed, setCommitted] = useState(searchParams.get('commit') === '1');
  const [submitTick, setSubmitTick] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentSearchItem[]>([]);
  const [recentTotal, setRecentTotal] = useState(0);
  const [recentCursor, setRecentCursor] = useState<number | null>(null);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState('');
  const recentRequestRef = useRef(0);
  const recentBusyRef = useRef(false);
  /** 포커스가 돌아와도 더보기로 펼친 목록과 커서를 유지한다. */
  const recentLoadedRef = useRef(false);
  const recentMutationRef = useRef(false);
  const [recentMutating, setRecentMutating] = useState(false);
  const [userResults, setUserResults] = useResettableState<SearchAccount[]>(
    [],
    [phase, parsed.mode, parsed.term, committed, submitTick],
  );
  const [tagResults, setTagResults] = useResettableState<MockHashtag[]>(
    [],
    [phase, parsed.mode, parsed.term, committed, submitTick],
  );
  const [resultState, setResultState] = useResettableState<'idle' | 'pending' | 'ready'>(
    phase === 'active' && parsed.term.trim().length >= 2 ? 'pending' : 'idle',
    [phase, parsed.mode, parsed.term, committed, submitTick],
  );
  const [searching, setSearching] = useResettableState(false, [
    phase,
    parsed.mode,
    parsed.term,
    committed,
    submitTick,
  ]);
  /** 엔터로 확정하면 20건. 글자가 바뀌면 미리보기 5건으로 돌아간다 */
  /** 같은 검색이면 목록을 다시 받지 않는다 */

  const [isInputFocused, setIsInputFocused] = useResettableState(
    false,
    [phase],
    phase !== 'active',
  );
  const [recommendedPosts, setRecommendedPosts] =
    useState<FeedGridItem[]>(RECOMMENDED_PLACEHOLDERS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.searchRecommended, {
          limit: 10,
        });
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
        if (!cancelled) setLoadFailed({ error: err });
        if (!cancelled) setRecommendedPosts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    replaceSearchUrl(searchListPath(phase === 'active', query, committed));
  }, [phase, query, committed]);

  useEffect(() => {
    if (phase === 'active') {
      inputRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active') return;
    const term = parsed.term.trim();
    if (term.length < 2) return;

    const limit = committed ? COMMIT_LIMIT : PREVIEW_LIMIT;
    const type = searchType(parsed.mode);

    let cancelled = false;
    const delay = committed ? 0 : PREVIEW_DELAY_MS;
    const timer = window.setTimeout(() => {
      setSearching(true);
      bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, { q: term, type, limit })
        .then((res) => {
          if (cancelled) return;
          const data = res.data ?? res;
          if (type === 'TAG') setTagResults(mapSearchTags(data));
          else setUserResults(mapSearchUsers(data));
          setResultState('ready');
        })
        .catch((err) => {
          console.error('[search] preview failed', err);
          if (cancelled) return;
          setUserResults([]);
          setLoadFailed({ error: err });
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
  }, [
    phase,
    parsed.mode,
    parsed.term,
    committed,
    submitTick,
    setSearching,
    setTagResults,
    setUserResults,
    setResultState,
  ]);

  const showRecent = phase === 'active' && query.trim() === '';
  const termLength = parsed.term.trim().length;
  const canSuggest = termLength >= 2;
  const showMinLengthHint = phase === 'active' && termLength === 1;

  const showAccountList = phase === 'active' && parsed.mode !== 'hashtag' && canSuggest;

  const showHashtagList = phase === 'active' && parsed.mode === 'hashtag' && canSuggest;

  async function loadRecent() {
    if (recentMutationRef.current) return;
    const request = ++recentRequestRef.current;
    recentBusyRef.current = true;
    setRecentLoading(true);
    setRecentError('');
    try {
      const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.searchRecent);
      if (request !== recentRequestRef.current) return;
      const data = res.data ?? res;
      setRecentItems(mapRecentItems(data));
      setRecentTotal(isRecord(data) && typeof data.totalCount === 'number' ? data.totalCount : 0);
      setRecentCursor(
        isRecord(data) && typeof data.nextCursorHistoryId === 'number'
          ? data.nextCursorHistoryId
          : null,
      );
      recentLoadedRef.current = true;
    } catch (err) {
      if (request !== recentRequestRef.current) return;
      console.error('[search] recent failed', err);
      setLoadFailed({ error: err });
      recentLoadedRef.current = false;
      setRecentItems([]);
      setRecentTotal(0);
      setRecentCursor(null);
    } finally {
      if (request === recentRequestRef.current) {
        recentBusyRef.current = false;
        setRecentLoading(false);
      }
    }
  }

  async function loadMoreRecent() {
    if (
      recentBusyRef.current ||
      recentMutationRef.current ||
      recentCursor == null ||
      recentItems.length >= recentTotal
    )
      return;
    const request = ++recentRequestRef.current;
    recentBusyRef.current = true;
    setRecentLoading(true);
    setRecentError('');
    try {
      const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.searchRecentMore, {
        cursorHistoryId: recentCursor,
      });
      if (request !== recentRequestRef.current) return;
      const data = res.data ?? res;
      const nextItems = mapRecentItems(data);
      setRecentItems((previous) => {
        const seen = new Set(previous.map((item) => item.historyId));
        return [...previous, ...nextItems.filter((item) => !seen.has(item.historyId))];
      });
      setRecentTotal(isRecord(data) && typeof data.totalCount === 'number' ? data.totalCount : 0);
      setRecentCursor(
        isRecord(data) && typeof data.nextCursorHistoryId === 'number'
          ? data.nextCursorHistoryId
          : null,
      );
    } catch (err) {
      if (request === recentRequestRef.current) {
        console.error('[search] recent more failed', err);
        setLoadFailed({ error: err });
        setRecentError('최근 검색 항목을 더 불러오지 못했습니다. 다시 시도해 주세요.');
      }
    } finally {
      if (request === recentRequestRef.current) {
        recentBusyRef.current = false;
        setRecentLoading(false);
      }
    }
  }

  function invalidateRecentRequest() {
    recentRequestRef.current++;
    recentBusyRef.current = false;
    setRecentLoading(false);
    setRecentError('');
  }

  async function enterUltary(account: SearchAccount, href = myUltaryPath(account.nickname)) {
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

  function enterRecentTag(item: RecentSearchTag) {
    replaceSearchUrl(searchListPath(true, query, committed));
    router.push(`/search/tags/${item.tagId}`);
  }

  const openSearch = () => {
    setPhase('active');
    if (!recentLoadedRef.current && !recentBusyRef.current) void loadRecent();
  };

  const restoreRecommended = () => {
    setPhase('idle');
    setQuery('');
    setCommitted(false);
    setSearching(false);
    setResultState('idle');
    setIsInputFocused(false);
  };

  const cancelSearch = () => {
    restoreRecommended();
  };

  const onInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(false);
    if (query.trim() !== '') return;
    const next = event.relatedTarget;
    if (next instanceof Node && shellRef.current?.contains(next)) return;
    window.setTimeout(() => {
      if (shellRef.current?.contains(document.activeElement)) return;
      restoreRecommended();
    }, 0);
  };

  function confirmClearRecent() {
    if (recentMutationRef.current) return;
    openModal({
      variant: 'confirm',
      title: '최근 검색 항목 삭제',
      content: '최근 검색 항목을 모두 지울까요?',
      showCloseButton: true,
      cancelButton: { label: '취소' },
      okButton: {
        label: '모두 지우기',
        tone: 'danger',
        onClick: () => void clearRecent(),
      },
    });
  }

  async function clearRecent() {
    if (recentMutationRef.current) return;
    recentMutationRef.current = true;
    setRecentMutating(true);
    invalidateRecentRequest();
    try {
      await bffDelete(bffEndpoints.main.searchRecent);
      setRecentItems([]);
      setRecentTotal(0);
      setRecentCursor(null);
    } catch (err) {
      console.error('[search] recent clear failed', err);
    } finally {
      recentMutationRef.current = false;
      setRecentMutating(false);
    }
  }

  async function removeRecent(historyId: number) {
    if (recentMutationRef.current) return;
    recentMutationRef.current = true;
    setRecentMutating(true);
    let reload = false;
    invalidateRecentRequest();
    const remaining = recentItems.filter((item) => item.historyId !== historyId);
    setRecentItems((list) => list.filter((item) => item.historyId !== historyId));
    setRecentTotal((total) => Math.max(0, total - 1));
    if (recentCursor === historyId) setRecentCursor(remaining.at(-1)?.historyId ?? null);
    try {
      await bffDelete(bffEndpoints.main.searchRecentItem, {
        userSearchHistoryId: historyId,
      });
      reload = remaining.length === 0;
    } catch (err) {
      console.error('[search] recent remove failed', err);
      reload = true;
    } finally {
      recentMutationRef.current = false;
      setRecentMutating(false);
      if (reload) void loadRecent();
    }
  }

  const onChangeQuery = (value: string) => {
    setQuery(value);
    setCommitted(false);
  };

  const clearQuery = () => {
    setQuery('');
    setCommitted(false);
    setUserResults([]);
    setTagResults([]);
    setResultState('idle');
    setSearching(false);
    inputRef.current?.focus();
  };

  const submitSearch = () => {
    if (!parsed.term.trim()) return;
    setCommitted(true);
    setSubmitTick((tick) => tick + 1);
  };

  const openHashtag = (tag: string) => {
    const hit = tagResults.find((item) => item.tag === tag);
    if (hit?.tagId == null) return;
    replaceSearchUrl(searchListPath(true, query, committed));
    router.push(`/search/tags/${hit.tagId}`);
  };

  const nickHighlight = parsed.mode === 'plain' ? parsed.term : '';
  const petHighlight =
    parsed.mode === 'pet' ? `@${parsed.term}` : parsed.mode === 'plain' ? parsed.term : '';

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

  return (
    <div className={styles.shell} ref={shellRef}>
      <header className={styles.header}>
        {phase === 'idle' ? (
          <button type="button" className={styles.searchBarIdle} onClick={openSearch}>
            <Image src={SearchIcon} alt="" width={20} height={20} className={styles.searchIcon} />
            <span className={styles.searchPlaceholder}>검색</span>
          </button>
        ) : (
          <>
            <label className={clsx(styles.searchBar, isInputFocused && styles.searchBarFocus)}>
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
                onBlur={onInputBlur}
                aria-label="검색"
              />
              {searching && query.length > 0 ? (
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

      <main className={styles.main}>
        {phase === 'idle' ? <FeedGrid posts={recommendedPosts} /> : null}

        {showMinLengthHint ? (
          <p className={styles.minLengthHint} role="status">
            2글자 이상 입력해주세요.
          </p>
        ) : null}

        {showRecent && recentItems.length > 0 ? (
          <div className={styles.searchPanel}>
            <div className={styles.recentHeader}>
              <span className={styles.recentTitle}>최근 검색 항목</span>
              <button
                type="button"
                className={styles.clearAllBtn}
                disabled={recentMutating}
                onMouseDown={(event) => event.preventDefault()}
                onClick={confirmClearRecent}
              >
                모두 지우기
              </button>
            </div>
            <ul className={styles.accountList}>
              {recentItems.map((item) =>
                item.kind === 'TAG' ? (
                  <RecentTagRow
                    key={`tag-${item.historyId}`}
                    item={item}
                    onEnter={enterRecentTag}
                    onRemove={() => removeRecent(item.historyId)}
                  />
                ) : (
                  <AccountRow
                    key={`user-${item.historyId}`}
                    account={item}
                    highlightQuery=""
                    petQuery=""
                    onEnter={enterUltary}
                    onRemove={() => removeRecent(item.historyId)}
                  />
                ),
              )}
            </ul>
            {recentError ? (
              <p className={styles.recentError} role="alert">
                {recentError}
              </p>
            ) : null}
            {recentCursor != null && recentItems.length < recentTotal ? (
              <div className={styles.recentMoreRow}>
                <button
                  type="button"
                  className={styles.recentMoreBtn}
                  disabled={recentLoading || recentMutating}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void loadMoreRecent()}
                >
                  {recentLoading ? '불러오는 중…' : '더보기'}
                </button>
              </div>
            ) : null}
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
              <EmptyState title="해시태그가 없어요" description="다른 키워드로 검색해 보세요." />
            ) : (
              <HashtagResultList
                items={tagResults}
                highlightQuery={query}
                onSelect={openHashtag}
                variant="page"
              />
            )}
          </div>
        ) : null}
      </main>

      <FooterMenu />
    </div>
  );
}
