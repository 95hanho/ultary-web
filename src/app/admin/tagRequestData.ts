import { isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
export type TagRequest = {
  requestId: number;
  tagId: number | null;
  hashtag: string;
  feedCount: number;
  title: string;
  content: string;
  link: string;
  status: string;
  createdAt: string;
  reviewedAt: string;
  statusChangedAt: string;
  requesterUserNo: number | null;
  requesterNickname: string | null;
  rejectMessage: string;
  imageUrls: string[];
};

export function readTagRequest(item: Record<string, unknown>): TagRequest | null {
  if (typeof item.requestId !== 'number') return null;
  const hashtag = typeof item.hashtag === 'string' ? item.hashtag.trim().replace(/^#/, '') : '';
  if (!hashtag) return null;
  const imageUrls = imageUrlsOf(item.images);
  return {
    requestId: item.requestId,
    tagId: typeof item.tagId === 'number' ? item.tagId : null,
    hashtag,
    feedCount: typeof item.feedCount === 'number' ? item.feedCount : 0,
    title: textOf(item.title),
    content: textOf(item.content),
    link: textOf(item.link),
    status: typeof item.status === 'string' ? item.status : '',
    createdAt: textOf(item.createdAt),
    reviewedAt: textOf(item.reviewedAt),
    statusChangedAt: textOf(item.statusChangedAt),
    requesterUserNo: typeof item.requesterUserNo === 'number' ? item.requesterUserNo : null,
    requesterNickname: textOf(item.requesterNickname) || null,
    rejectMessage: textOf(item.rejectMessage),
    imageUrls,
  };
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function imageUrlsOf(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const urls: string[] = [];
  for (const image of raw) {
    if (!isRecord(image) || typeof image.filePath !== 'string') continue;
    const fileId = typeof image.fileId === 'number' ? image.fileId : Number(image.fileId);
    if (!Number.isFinite(fileId)) continue;
    const url = resolveFileDisplayUrl({ fileId, filePath: image.filePath });
    if (url) urls.push(url);
  }
  return urls;
}
