import type { FeedData, FeedPhotoTag } from '@/components/feed/Feed';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { FeedDetailResponse } from '@/types/feed';
import { isRecord } from '@/lib/api/error';

const FALLBACK_POST = '/images/mock/post.jpg';

function tagRatio(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const ratio = value > 1 ? value / 100 : value;
  return Math.min(1, Math.max(0, ratio));
}

function readPhotoTags(media: unknown): FeedPhotoTag[] {
  if (!isRecord(media) || !Array.isArray(media.mentions)) return [];
  return media.mentions.flatMap((item) => {
    if (!isRecord(item) || typeof item.petId !== 'number') return [];
    const x = tagRatio(item.posX);
    const y = tagRatio(item.posY);
    if (x == null || y == null) return [];
    return [{ petId: item.petId, x, y }];
  });
}

/**
 * Spring 피드 단건 → UI FeedData.
 * nickname은 응답 루트 또는 author.* 에서 읽음 (spring-auth-api.md).
 */
export function toFeedData(raw: unknown, fallbackId: string): FeedData {
  if (!isRecord(raw)) {
    return {
      id: fallbackId,
      nickname: 'ULTARY',
      profileUrl: NO_PROFILE_SRC,
      images: [FALLBACK_POST],
      caption: '',
      likeCount: 0,
      commentCount: 0,
    };
  }

  const detail = raw as FeedDetailResponse & {
    nickname?: string | null;
    authorNickname?: string | null;
    profileFile?: FeedDetailResponse['authorProfileFile'];
    author?: {
      nickname?: string | null;
      profileFile?: FeedDetailResponse['authorProfileFile'];
    };
  };

  const nickname =
    detail.nickname?.trim() ||
    detail.authorNickname?.trim() ||
    detail.author?.nickname?.trim() ||
    'ULTARY';

  const profileUrl =
    resolveFileDisplayUrl(
      detail.authorProfileFile ??
        detail.profileFile ??
        detail.author?.profileFile,
    ) ?? NO_PROFILE_SRC;

  const slides = [...(detail.media ?? [])]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .flatMap((media) => {
      const src = resolveFileDisplayUrl(media.file ?? media.thumbnailFile);
      if (!src) return [];
      const feedMediaId =
        typeof media.feedMediaId === 'number' ? media.feedMediaId : null;
      return [{ src, tags: readPhotoTags(media), feedMediaId }];
    });

  const images = slides.map((slide) => slide.src);
  const mediaIds = slides.map((slide) => slide.feedMediaId);
  const photoTags = slides.map((slide) => slide.tags);

  const cover = resolveFileDisplayUrl(
    detail.coverFile ?? detail.coverThumbnailFile,
  );
  if (cover && images.length === 0) {
    images.push(cover);
    mediaIds.push(null);
    photoTags.push([]);
  }
  if (images.length === 0) {
    images.push(FALLBACK_POST);
    mediaIds.push(null);
    photoTags.push([]);
  }

  return {
    id: String(detail.feedId ?? fallbackId),
    userNo: typeof detail.userNo === 'number' ? detail.userNo : undefined,
    nickname,
    profileUrl,
    images,
    mediaIds,
    photoTags,
    caption: detail.content?.trim() || '',
    likeCount: detail.likeCount ?? 0,
    commentCount: detail.commentCount ?? 0,
    isFavorite: detail.likedByMe === true,
    isStored: detail.storedByMe === true,
  };
}

/** BFF `{ success, data }` 또는 data 배열/커서 응답 → FeedData[] */
export function toFeedDataList(raw: unknown): FeedData[] {
  const list = unwrapList(raw);
  return list.map((item, i) => toFeedData(item, `feed-${i}`));
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.content)) return raw.content;
  return [];
}
