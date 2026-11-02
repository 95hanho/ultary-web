const KEY = 'ultaryFeedEditReturn';
type EditReturn = {
  feedId: string;
  url: string;
  scrollY: number;
  anchorTop: number | null;
  pending: boolean;
};
let memory: EditReturn | null = null;

function read(): EditReturn | null {
  if (typeof window === 'undefined') return null;
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(KEY) ?? 'null');
    if (value && typeof value === 'object') {
      const r = value as EditReturn;
      if (typeof r.feedId === 'string' && typeof r.url === 'string'
        && r.url.startsWith('/') && new URL(r.url, window.location.origin).origin === window.location.origin
        && Number.isFinite(r.scrollY) && r.scrollY >= 0
        && (r.anchorTop === null || Number.isFinite(r.anchorTop)) && typeof r.pending === 'boolean') return r;
    }
  } catch { /* Memory fallback when browser storage is unavailable. */ }
  return memory;
}

function write(value: EditReturn) {
  memory = value;
  try { window.sessionStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Memory fallback. */ }
}

export function saveFeedEditReturn(feedId: string) {
  if (typeof window === 'undefined') return;
  write({
    feedId,
    url: window.location.pathname + window.location.search + window.location.hash,
    scrollY: window.scrollY,
    anchorTop: document.getElementById(`feed-${feedId}`)?.getBoundingClientRect().top ?? null,
    pending: false,
  });
}

export function requestFeedEditReturn(feedId: string): string | null {
  const saved = read();
  if (!saved || saved.feedId !== feedId) return null;
  write({ ...saved, pending: true });
  return saved.url;
}

export function readPendingFeedEditReturn() {
  const saved = read();
  if (!saved?.pending) return null;
  const url = window.location.pathname + window.location.search + window.location.hash;
  return saved.url === url ? saved : null;
}

export function clearFeedEditReturn() {
  memory = null;
  try { window.sessionStorage.removeItem(KEY); } catch { /* Memory already cleared. */ }
}

/** Retry while async feeds/images build the page; reaching the end also loads more feed pages. */
export function restoreFeedEditScroll(saved: EditReturn) {
  let frame = 0, stopped = false, stable = 0;
  const deadline = performance.now() + 20_000;
  const stop = (consume: boolean) => {
    stopped = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', cancel);
    if (consume) clearFeedEditReturn();
  };
  const cancel = () => stop(true);
  const step = () => {
    if (stopped) return;
    if (!readPendingFeedEditReturn()) return stop(false);
    if (window.location.pathname + window.location.search + window.location.hash !== saved.url) {
      stop(true);
      return;
    }
    const anchor = document.getElementById(`feed-${saved.feedId}`);
    const visible = anchor && anchor.getClientRects().length > 0;
    const target = visible && saved.anchorTop !== null
      ? Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - saved.anchorTop)
      : saved.scrollY;
    window.scrollTo({ top: target, behavior: 'instant' });
    stable = (saved.anchorTop === null || visible) && Math.abs(window.scrollY - target) < 2 ? stable + 1 : 0;
    if (stable >= 6 || performance.now() >= deadline) stop(true);
    else frame = requestAnimationFrame(step);
  };
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', cancel);
  frame = requestAnimationFrame(step);
  return () => stop(false);
}
