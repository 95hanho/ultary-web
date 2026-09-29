const storageKey = (nickname: string) => `ultary:grid-scroll:${nickname}`;

export type UltaryGridTab = 'feed' | 'saved' | 'tagged';

export type UltaryGridScroll = {
  tab: UltaryGridTab;
  scrollY: number;
};

export function saveUltaryGridScroll(nickname: string, tab: UltaryGridTab) {
  if (typeof window === 'undefined') return;
  const payload: UltaryGridScroll = {
    tab,
    scrollY: window.scrollY,
  };
  sessionStorage.setItem(storageKey(nickname), JSON.stringify(payload));
}

export function readUltaryGridScroll(nickname: string): UltaryGridScroll | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(storageKey(nickname));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UltaryGridScroll;
    if (
      (parsed.tab === 'feed' || parsed.tab === 'saved' || parsed.tab === 'tagged') &&
      typeof parsed.scrollY === 'number'
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearUltaryGridScroll(nickname: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(storageKey(nickname));
}
