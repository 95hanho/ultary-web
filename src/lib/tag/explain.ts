import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import type { TagExplain } from '@/lib/mock/tags';
import type { BffEnvelope } from '@/types/api';

type TagHit = {
  tagId: number;
  hashtag: string;
  title: string | null;
  content: string | null;
  link: string | null;
  imageUrl: string;
  useCount: number;
};

const detailInflight = new Map<number, Promise<TagHit | null>>();
const searchInflight = new Map<string, Promise<TagHit[]>>();

function sameHashtag(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function parseTag(raw: unknown): TagHit | null {
  if (!isRecord(raw)) return null;
  const tagId = typeof raw.tagId === 'number' ? raw.tagId : Number(raw.tagId);
  const hashtag = typeof raw.hashtag === 'string' ? raw.hashtag.trim() : '';
  if (!Number.isFinite(tagId) || !hashtag) return null;

  let imageUrl = '';
  if (Array.isArray(raw.images)) {
    for (const image of raw.images) {
      if (!isRecord(image) || typeof image.filePath !== 'string') continue;
      const fileId = typeof image.fileId === 'number' ? image.fileId : Number(image.fileId);
      if (!Number.isFinite(fileId)) continue;
      const url = resolveFileDisplayUrl({ fileId, filePath: image.filePath });
      if (url) {
        imageUrl = url;
        break;
      }
    }
  }

  return {
    tagId,
    hashtag,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : null,
    content: typeof raw.content === 'string' && raw.content.trim() ? raw.content.trim() : null,
    link: typeof raw.link === 'string' && raw.link.trim() ? raw.link.trim() : null,
    imageUrl,
    useCount: typeof raw.useCount === 'number' && raw.useCount > 0 ? raw.useCount : 0,
  };
}

function toExplain(tag: TagHit): TagExplain {
  return {
    tag: tag.hashtag,
    title: tag.title ?? tag.hashtag,
    imageUrl: tag.imageUrl || undefined,
    description: tag.content ?? `#${tag.hashtag} 태그에 대한 설명이 아직 없습니다.`,
    linkUrl: tag.link ?? undefined,
    linkLabel: tag.link ? '관련 링크' : undefined,
    postCount: tag.useCount,
  };
}

function emptyExplain(hashtag: string): TagExplain {
  return {
    tag: hashtag,
    title: hashtag,
    description: `#${hashtag} 태그에 대한 설명이 아직 없습니다.`,
    postCount: 0,
  };
}

function fetchDetail(tagId: number) {
  const cached = detailInflight.get(tagId);
  if (cached) return cached;
  const pending = bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.detail, { tagId })
    .then((res) => parseTag(res.data))
    .catch(() => null);
  detailInflight.set(tagId, pending);
  return pending;
}

function searchExact(hashtag: string) {
  const key = hashtag.toLowerCase();
  const cached = searchInflight.get(key);
  if (cached) return cached;
  const pending = bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.search, {
    q: hashtag,
    limit: 20,
  })
    .then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      return list.flatMap((item) => {
        const tag = parseTag(item);
        return tag && sameHashtag(tag.hashtag, hashtag) ? [tag] : [];
      });
    })
    .catch((err: unknown) => {
      searchInflight.delete(key);
      throw err;
    });
  searchInflight.set(key, pending);
  return pending;
}

/**
 * 캡션 `#태그` 설명.
 * 이 글에 연결된 tagId가 검색 결과에 있으면 그 태그를 쓰고, 없으면 해시태그가 같은 태그를 쓴다.
 */
export async function loadTagExplain(rawTag: string, linkedTagIds: number[] = []) {
  const hashtag = rawTag.replace(/^#/, '').trim();
  if (!hashtag) return emptyExplain('');

  try {
    const hits = await searchExact(hashtag);
    const linked = linkedTagIds
      .map((id) => hits.find((hit) => hit.tagId === id))
      .find((hit) => hit != null);
    if (linked) return toExplain(linked);
    if (hits[0]) return toExplain(hits[0]);

    for (const tagId of linkedTagIds) {
      const detail = await fetchDetail(tagId);
      if (detail && sameHashtag(detail.hashtag, hashtag)) return toExplain(detail);
    }
  } catch {
    return emptyExplain(hashtag);
  }

  return emptyExplain(hashtag);
}
