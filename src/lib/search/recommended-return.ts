import type { FeedGridItem } from '@/components/feed/FeedGrid';

const HISTORY_KEY = 'ultarySearchRecommendedReturn';
type RecommendedReturn = {
  entry: string;
  url: string;
  posts: FeedGridItem[];
  scrollY: number;
  nextCursor: string | null;
};
// Keep only the grid that opened a post, scoped to this browser runtime and history entry.
let saved: RecommendedReturn | null = null;

export function saveRecommendedReturn(posts: FeedGridItem[], nextCursor: string | null = null) {
  if (typeof window === 'undefined') return;
  const entry = crypto.randomUUID();
  window.history.replaceState({ ...window.history.state, [HISTORY_KEY]: entry }, '');
  saved = {
    entry,
    url: window.location.pathname + window.location.search,
    posts: posts.map((post) => ({ ...post })),
    scrollY: window.scrollY,
    nextCursor,
  };
}

export function readRecommendedReturn() {
  if (typeof window === 'undefined' || !saved) return null;
  if (window.history.state?.[HISTORY_KEY] !== saved.entry) return null;
  if (window.location.pathname + window.location.search !== saved.url) return null;
  return saved;
}
