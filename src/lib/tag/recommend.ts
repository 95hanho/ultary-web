import { isRecord } from '@/lib/api/error';

export type RecommendTag = {
  /** DB에 있으면 숫자, 신규 후보면 null */
  tagId: number | null;
  /** `#` 포함 */
  tag: string;
};

/** CSS·UI 확인용. API 연동 시 `USE_MOCK_TAG_RECOMMEND`를 false로 */
export const USE_MOCK_TAG_RECOMMEND = false;

export const MOCK_RECOMMEND_TAGS: RecommendTag[] = [
  { tagId: 1, tag: '#산책' },
  { tagId: 2, tag: '#강아지' },
  { tagId: 3, tag: '#푸들' },
  { tagId: null, tag: '#오늘도산책' },
  { tagId: 5, tag: '#반려동물' },
];

function listFrom(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

/** GET /tags/recommend 응답 → 칩 목록 */
export function mapRecommendTags(raw: unknown): RecommendTag[] {
  const seen = new Set<string>();
  const out: RecommendTag[] = [];

  for (const item of listFrom(raw)) {
    if (!isRecord(item)) continue;
    const hashtag =
      typeof item.hashtag === 'string'
        ? item.hashtag.trim().replace(/^#/, '')
        : typeof item.tag === 'string'
          ? item.tag.trim().replace(/^#/, '')
          : '';
    if (!hashtag) continue;
    const key = hashtag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const tagId = typeof item.tagId === 'number' && Number.isFinite(item.tagId) ? item.tagId : null;
    out.push({ tagId, tag: `#${hashtag}` });
  }

  return out;
}
