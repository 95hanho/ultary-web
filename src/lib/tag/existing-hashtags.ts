import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import {
  listHashtagBodies,
  normalizeHashtagBody,
} from '@/lib/search/hashtag-input';
import type { BffEnvelope } from '@/types/api';

function listFrom(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

/** tags/search 응답에서 본문과 정확히 같은 기존 태그인지 */
async function isExistingHashtag(body: string): Promise<boolean> {
  const key = normalizeHashtagBody(body);
  if (!key) return false;
  try {
    const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.search, {
      q: body,
      limit: 10,
    });
    for (const item of listFrom(res.data ?? res)) {
      if (!isRecord(item) || typeof item.tagId !== 'number') continue;
      const hashtag =
        typeof item.hashtag === 'string'
          ? item.hashtag.trim().replace(/^#/, '')
          : '';
      if (normalizeHashtagBody(hashtag) === key) return true;
    }
  } catch (err) {
    console.error('[tags] existing lookup failed', body, err);
  }
  return false;
}

/**
 * 본문 해시태그 중 DB에 있는 것만 모은다.
 * `known`에 이미 있는 키는 재조회하지 않는다.
 */
export async function resolveExistingHashtagBodies(
  caption: string,
  known: Iterable<string> = [],
): Promise<Set<string>> {
  const existing = new Set(
    [...known].map((body) => normalizeHashtagBody(body)).filter(Boolean),
  );
  const bodies = listHashtagBodies(caption);
  const pending = bodies
    .map((body) => normalizeHashtagBody(body))
    .filter((key) => key && !existing.has(key));

  const unique = [...new Set(pending)];
  await Promise.all(
    unique.map(async (key) => {
      if (await isExistingHashtag(key)) existing.add(key);
    }),
  );
  return existing;
}
