import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { listHashtagBodies, normalizeHashtagBody } from '@/lib/search/hashtag-input';
import type { WriteDraftItem } from '@/stores/write-draft.store';
import type { BffEnvelope } from '@/types/api';

export type CreateFeedMediaMention = {
  petId: number;
  /** 0~100 */
  posX: number;
  /** 0~100 */
  posY: number;
};

export type CreateFeedMedia = {
  fileId: number;
  mediaType: 'IMAGE' | 'VIDEO';
  mentions?: CreateFeedMediaMention[];
};

export type CreateFeedBody = {
  content?: string;
  visibility?: 'PUBLIC' | 'NEIGHBORS' | 'PRIVATE';
  media: CreateFeedMedia[];
  pets?: Array<{ petId: number; role?: 'TAGGED' | 'COLLABORATOR'; isMain?: boolean }>;
  tagIds?: number[];
};

async function uploadDataUrl(
  dataUrl: string,
  fileName: string,
  mimeType: string,
): Promise<number> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const form = new FormData();
  form.append(
    'file',
    new File([blob], fileName.trim() || 'media.bin', {
      type: blob.type || mimeType || 'application/octet-stream',
    }),
  );
  const uploadRes = await fetch(bffEndpoints.files.root, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  const json = (await uploadRes.json().catch(() => null)) as BffEnvelope<unknown> | null;
  const fileId =
    isRecord(json?.data) && typeof json.data.fileId === 'number' ? json.data.fileId : null;
  if (!uploadRes.ok || !json?.success || fileId == null) {
    throw new Error('파일 업로드에 실패했습니다.');
  }
  return fileId;
}

function readExactTagId(raw: unknown, hashtag: string): number | null {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
      : isRecord(raw) && Array.isArray(raw.data)
        ? raw.data
        : [];
  const key = normalizeHashtagBody(hashtag);
  for (const item of list) {
    if (!isRecord(item) || typeof item.hashtag !== 'string' || typeof item.tagId !== 'number') {
      continue;
    }
    if (normalizeHashtagBody(item.hashtag) === key) return item.tagId;
  }
  return null;
}

/** 본문 해시태그 → tagId (없으면 생성) */
export async function resolveCaptionTagIds(caption: string, existingTags: Array<{ tagId: number; hashtag: string }> = []): Promise<number[]> {
  const bodies = [...new Set(listHashtagBodies(caption).map((b) => b.trim()).filter(Boolean))];
  const ids: number[] = [];
  for (const body of bodies) {
    const searchRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.search, {
      q: body,
      limit: 20,
    });
    let tagId = readExactTagId(searchRes.data ?? searchRes, body);
    if (tagId == null) tagId = existingTags.find(tag => normalizeHashtagBody(tag.hashtag) === normalizeHashtagBody(body))?.tagId ?? null;
    if (tagId == null) {
      const created = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.tags.root, {
        hashtag: body,
      });
      tagId =
        isRecord(created.data) && typeof created.data.tagId === 'number'
          ? created.data.tagId
          : null;
    }
    if (tagId != null) ids.push(tagId);
  }
  return ids;
}

function toPercent(ratio: number): number {
  const value = Number.isFinite(ratio) ? ratio * 100 : 0;
  return Math.min(100, Math.max(0, Math.round(value * 100) / 100));
}

/** draft 미디어·본문으로 게시글 등록 */
export async function createFeedFromDraft(input: {
  caption: string;
  items: WriteDraftItem[];
  visibility?: CreateFeedBody['visibility'];
}): Promise<unknown> {
  const { caption, items, visibility = 'PUBLIC' } = input;
  if (items.length === 0) throw new Error('미디어가 필요합니다.');

  const media: CreateFeedMedia[] = [];
  const petMap = new Map<number, { petId: number; role: 'TAGGED'; isMain: boolean }>();

  for (const item of items) {
    const source =
      item.kind === 'image' ? (item.croppedDataUrl ?? item.sourceUrl) : item.sourceUrl;
    const fileId = await uploadDataUrl(source, item.fileName, item.mimeType);
    const mentions: CreateFeedMediaMention[] = [];
    for (const tag of item.petTags ?? []) {
      if (tag.petId == null) continue;
      mentions.push({
        petId: tag.petId,
        posX: toPercent(tag.x),
        posY: toPercent(tag.y),
      });
      if (!petMap.has(tag.petId)) {
        petMap.set(tag.petId, {
          petId: tag.petId,
          role: 'TAGGED',
          isMain: petMap.size === 0,
        });
      }
    }
    media.push({
      fileId,
      mediaType: item.kind === 'video' ? 'VIDEO' : 'IMAGE',
      mentions: mentions.length > 0 ? mentions : undefined,
    });
  }

  const tagIds = await resolveCaptionTagIds(caption);
  const pets = [...petMap.values()];
  if (pets.length > 0) {
    pets[0]!.isMain = true;
  }

  const body: CreateFeedBody = {
    content: caption.trim() || undefined,
    visibility,
    media,
    pets: pets.length > 0 ? pets : undefined,
    tagIds: tagIds.length > 0 ? tagIds : undefined,
  };

  return bffPostJson<BffEnvelope<unknown>>(bffEndpoints.feeds.root, body);
}
