import type { FeedData } from '@/components/feed/Feed';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedData, toFeedDataList } from '@/lib/feed/toFeedData';
import { clearFeedEditReturn } from '@/lib/feed/edit-return';
import type { BffEnvelope, MeResponse } from '@/types/api';
import type { StoryOwner } from '@/types/story';

type TimelinePage = { items: unknown[]; nextCursorFeedId: number | null };
type RecommendedPage = { items: unknown[]; nextCursor: string | null };
type MainSession = {
  feeds: FeedData[];
  recommended: FeedData[];
  advertisements: FeedData[];
  owners: StoryOwner[];
  me: MeResponse | null;
  timelineCursor: number | null;
  recommendedCursor: string | null;
  ready: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: unknown;
  moreError: boolean;
  revision: number;
};

const EMPTY: MainSession = {
  feeds: [],
  recommended: [],
  advertisements: [],
  owners: [],
  me: null,
  timelineCursor: null,
  recommendedCursor: null,
  ready: false,
  loading: false,
  loadingMore: false,
  error: null,
  moreError: false,
  revision: 0,
};
// Browser-runtime only. A document reload creates an empty session and refetches.
let state = EMPTY;
let scrollY = 0;
let initialRequest: Promise<void> | null = null;
let pageRequest: Promise<void> | null = null;
let storyOwnersDirty = false;
let storyOwnerRequest: Promise<void> | null = null;
const listeners = new Set<() => void>();
const publish = (patch: Partial<MainSession>) => {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
};
export const getMainFeedServerSnapshot = () => EMPTY;
export const getMainFeedSession = () => (typeof window === 'undefined' ? EMPTY : state);
export function subscribeMainFeedSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export const getMainScroll = () => (typeof window === 'undefined' ? 0 : scrollY);
export function saveMainScroll(value: number) {
  if (typeof window !== 'undefined' && window.location.pathname === '/' && Number.isFinite(value)) {
    scrollY = Math.max(0, value);
  }
}

async function fetchInitial() {
  publish({ loading: true, error: null, moreError: false });
  storyOwnersDirty = false;
  try {
    // Keep the busy flag until every request settles, including an early failure.
    const results = await Promise.allSettled([
      bffGet<BffEnvelope<TimelinePage>>(bffEndpoints.main.feeds, { limit: 10 }),
      bffGet<BffEnvelope<StoryOwner[]>>(bffEndpoints.main.storyOwners),
      bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me),
      bffGet<BffEnvelope<RecommendedPage>>(bffEndpoints.main.feedsRecommended, { limit: 10 }),
      bffGet<BffEnvelope<unknown[]>>(bffEndpoints.main.feedAdvertisements),
    ] as const);
    for (const result of results.slice(0, 4)) if (result.status === 'rejected') throw result.reason;
    const [feeds, owners, me, recommended, advertisements] = results;
    if (
      feeds.status !== 'fulfilled' ||
      owners.status !== 'fulfilled' ||
      me.status !== 'fulfilled' ||
      recommended.status !== 'fulfilled'
    )
      return;
    if (!feeds.value.data || !recommended.value.data || !me.value.data)
      throw Error('메인 응답이 올바르지 않습니다.');
    publish({
      feeds: toFeedDataList(feeds.value.data),
      recommended: toFeedDataList(recommended.value.data),
      advertisements:
        advertisements.status === 'fulfilled' && Array.isArray(advertisements.value.data)
          ? toFeedDataList(advertisements.value.data)
          : [],
      owners: Array.isArray(owners.value.data) ? owners.value.data : [],
      me: me.value.data,
      timelineCursor: feeds.value.data.nextCursorFeedId,
      recommendedCursor: recommended.value.data.nextCursor,
    });
  } catch (error) {
    publish({ error });
  } finally {
    initialRequest = null;
    publish({ loading: false, ready: true });
  }
}

export function ensureMainFeedSession() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (state.loading) return initialRequest ?? Promise.resolve();
  if (state.ready) return refreshMainStoryOwners();
  initialRequest = fetchInitial();
  return initialRequest;
}

/** 스토리 읽음 성공 후 메인으로 돌아오면 피드/스크롤은 유지하고 링 메타만 갱신한다. */
export function invalidateMainStoryOwners() {
  if (typeof window === 'undefined') return;
  storyOwnersDirty = true;
  if (window.location.pathname === '/') void refreshMainStoryOwners();
}

/** 닉네임태그 등 me 필드만 갱신 (피드 목록은 유지) */
export function patchMainSessionMe(me: MeResponse) {
  if (typeof window === 'undefined') return;
  publish({ me: state.me ? { ...state.me, ...me } : me });
}

function refreshMainStoryOwners(): Promise<void> {
  if (storyOwnerRequest) return storyOwnerRequest;
  if (!storyOwnersDirty || !state.ready || state.loading) return Promise.resolve();
  storyOwnersDirty = false;
  storyOwnerRequest = bffGet<BffEnvelope<StoryOwner[]>>(bffEndpoints.main.storyOwners)
    .then((response) => {
      if (!Array.isArray(response.data)) throw Error('스토리 응답이 올바르지 않습니다.');
      publish({ owners: response.data });
    })
    .catch(() => {
      storyOwnersDirty = true;
    })
    .finally(() => {
      storyOwnerRequest = null;
    });
  return storyOwnerRequest;
}

export function refreshMainFeedSession() {
  if (typeof window === 'undefined' || state.loading || state.loadingMore) return null;
  clearFeedEditReturn();
  scrollY = 0;
  window.scrollTo({ top: 0, behavior: 'instant' });
  publish({ revision: state.revision + 1 });
  initialRequest = fetchInitial();
  return initialRequest;
}

export function loadMoreMainFeeds() {
  if (
    typeof window === 'undefined' ||
    !state.ready ||
    state.error ||
    state.loading ||
    state.loadingMore ||
    (state.timelineCursor == null && state.recommendedCursor == null)
  )
    return pageRequest;
  const timelineCursor = state.timelineCursor,
    recommendedCursor = state.recommendedCursor;
  publish({ loadingMore: true, moreError: false });
  pageRequest = (async () => {
    try {
      if (timelineCursor != null) {
        const response = await bffGet<BffEnvelope<TimelinePage>>(bffEndpoints.main.feeds, {
          limit: 10,
          cursorFeedId: timelineCursor,
        });
        if (!response.data) throw Error('게시글 응답이 올바르지 않습니다.');
        const ids = new Set(state.feeds.map((feed) => feed.id));
        publish({
          feeds: [
            ...state.feeds,
            ...toFeedDataList(response.data).filter((feed) => !ids.has(feed.id)),
          ],
          timelineCursor: response.data.nextCursorFeedId,
        });
      } else {
        const response = await bffGet<BffEnvelope<RecommendedPage>>(
          bffEndpoints.main.feedsRecommended,
          { limit: 10, cursor: recommendedCursor },
        );
        if (!response.data) throw Error('추천 게시글 응답이 올바르지 않습니다.');
        const ids = new Set(state.recommended.map((feed) => feed.id));
        publish({
          recommended: [
            ...state.recommended,
            ...toFeedDataList(response.data).filter((feed) => !ids.has(feed.id)),
          ],
          recommendedCursor: response.data.nextCursor,
        });
      }
    } catch {
      publish({ moreError: true });
    } finally {
      pageRequest = null;
      publish({ loadingMore: false });
    }
  })();
  return pageRequest;
}

export function patchMainFeed(id: string, patch: Partial<FeedData>) {
  if (typeof window === 'undefined') return;
  if (
    ![...state.feeds, ...state.recommended, ...state.advertisements].some(
      (feed) =>
        feed.id === id &&
        Object.entries(patch).some(
          ([key, value]) => !Object.is(feed[key as keyof FeedData], value),
        ),
    )
  )
    return;
  publish({
    feeds: state.feeds.map((feed) => (feed.id === id ? { ...feed, ...patch, id } : feed)),
    recommended: state.recommended.map((feed) =>
      feed.id === id ? { ...feed, ...patch, id } : feed,
    ),
    advertisements: state.advertisements.map((feed) =>
      feed.id === id ? { ...feed, ...patch, id } : feed,
    ),
  });
}
export function updateMainFeed(raw: unknown) {
  if (raw && typeof raw === 'object' && 'data' in raw) raw = raw.data;
  if (typeof window === 'undefined' || !raw || typeof raw !== 'object' || !('feedId' in raw))
    return;
  const id = String(raw.feedId);
  if (
    [...state.feeds, ...state.recommended, ...state.advertisements].some((feed) => feed.id === id)
  )
    patchMainFeed(id, toFeedData(raw, id));
}
export function adjustMainCommentCount(id: string, delta: number) {
  const feed = [...state.feeds, ...state.recommended, ...state.advertisements].find(
    (feed) => feed.id === id,
  );
  if (feed) patchMainFeed(id, { commentCount: Math.max(0, (feed.commentCount ?? 0) + delta) });
}
export function removeMainFeed(id: string) {
  if (typeof window === 'undefined') return;
  publish({
    feeds: state.feeds.filter((feed) => feed.id !== id),
    recommended: state.recommended.filter((feed) => feed.id !== id),
    advertisements: state.advertisements.filter((feed) => feed.id !== id),
  });
}

/** Same-page home presses refresh only when idle. Other links retain normal navigation. */
export function handleMainHomeClick(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  preventDefault: () => void;
}) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    typeof window === 'undefined' ||
    window.location.pathname !== '/'
  )
    return;
  event.preventDefault();
  void refreshMainFeedSession();
}
