import 'server-only';

import type { FeedData } from '@/components/feed/Feed';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import type { FeedDetailResponse } from '@/types/feed';
import { isRecord } from '@/lib/api/error';

const FALLBACK_PROFILE = '/images/mock/profile.jpg';
const FALLBACK_POST = '/images/mock/post.jpg';

/**
 * Spring 피드 단건 → UI FeedData.
 * nickname은 응답 루트 또는 author.* 에서 읽음 (spring-auth-api.md).
 */
export function toFeedData(raw: unknown, fallbackId: string): FeedData {
  if (!isRecord(raw)) {
    return {
      id: fallbackId,
      nickname: 'ULTARY',
      profileUrl: FALLBACK_PROFILE,
      images: [FALLBACK_POST],
      caption: '',
      likeCount: 0,
      commentCount: 0,
    };
  }

  const detail = raw as FeedDetailResponse & {
    nickname?: string | null;
    authorNickname?: string | null;
    author?: { nickname?: string | null };
  };

  const nickname =
    detail.nickname?.trim() ||
    detail.authorNickname?.trim() ||
    detail.author?.nickname?.trim() ||
    'ULTARY';

  const profileUrl =
    resolveFileDisplayUrl(detail.authorProfileFile) ?? FALLBACK_PROFILE;

  const images =
    detail.media
      ?.map((m) => resolveFileDisplayUrl(m.file ?? m.thumbnailFile))
      .filter((u): u is string => Boolean(u)) ?? [];

  const cover = resolveFileDisplayUrl(
    detail.coverFile ?? detail.coverThumbnailFile,
  );
  if (cover && images.length === 0) images.push(cover);
  if (images.length === 0) images.push(FALLBACK_POST);

  return {
    id: String(detail.feedId ?? fallbackId),
    nickname,
    profileUrl,
    images,
    caption: detail.content?.trim() || '',
    likeCount: detail.likeCount ?? 0,
    commentCount: detail.commentCount ?? 0,
  };
}
