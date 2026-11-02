import type { FeedData } from '@/components/feed/Feed';

/** 광고 풀 순서는 세션 시작 시 한 번 정한다. 목록이 늘어도 기존 삽입 위치는 유지한다. */
export function insertFeedAdvertisements(feeds: FeedData[], advertisements: FeedData[]) {
  const used = new Set(feeds.map((feed) => feed.id));
  const pool = advertisements.filter((feed) => {
    if (!feed.advertisement || used.has(feed.id)) return false;
    used.add(feed.id);
    return true;
  });
  const result: FeedData[] = [];
  let count = 0,
    ad = 0,
    gap = 4;
  for (const feed of feeds) {
    result.push(feed);
    if (++count < gap || ad >= pool.length) continue;
    result.push(pool[ad++]);
    count = 0;
    gap = gap === 4 ? 5 : 4;
  }
  return result;
}
