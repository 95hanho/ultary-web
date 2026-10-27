type OpeningPage<T> = {
  list: T[];
  cursor: string | null;
  firstUnread: string | null;
};

/** Keep the initial unread anchor even though the first request marks the room read. */
export async function loadDmOpeningMessages<T extends { id: string }, P extends OpeningPage<T>>(
  load: (cursor?: string) => Promise<P>,
  isCurrent: () => boolean,
): Promise<P | null> {
  const initial = await load();
  if (!isCurrent()) return null;
  let list = initial.list;
  let cursor = initial.cursor;
  const visited = new Set<string>();
  while (initial.firstUnread && cursor && !list.some((item) => item.id === initial.firstUnread)) {
    if (visited.has(cursor)) throw new Error('DM pagination cursor did not advance');
    visited.add(cursor);
    const older = await load(cursor);
    if (!isCurrent()) return null;
    const known = new Set(list.map((item) => item.id));
    list = [...older.list.filter((item) => !known.has(item.id)), ...list];
    cursor = older.cursor;
  }
  return { ...initial, list, cursor };
}

export function dmOpeningScrollTop(
  scrollHeight: number,
  viewportHeight: number,
  anchorTop?: number,
  anchorHeight = 0,
) {
  const bottom = Math.max(0, scrollHeight - viewportHeight);
  if (anchorTop == null) return bottom;
  return Math.max(0, Math.min(bottom, anchorTop + anchorHeight / 2 - viewportHeight / 2));
}
