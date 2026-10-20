import { bffGet, bffPatchJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { loadMyUserNo } from '@/lib/auth/myUserNo';
import { resolveCaptionTagIds } from './createFeed';
import { resolveFeedPetLabels } from './petLabels';
import type { WriteDraftItem } from '@/stores/write-draft.store';
import type { BffEnvelope } from '@/types/api';
import type { FeedDetailResponse } from '@/types/feed';

export async function loadFeedEditDraft(feedId: string) {
  const [response, userNo] = await Promise.all([
    bffGet<BffEnvelope<FeedDetailResponse>>(bffEndpoints.feeds.detail, { feedId }),
    loadMyUserNo(),
  ]);
  const feed = response.data;
  if (!feed || userNo == null || feed.userNo !== userNo) throw new Error('본인이 작성한 게시글만 수정할 수 있습니다.');
  const media = [...(feed.media ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const petIds = [...new Set(media.flatMap((slot) => (slot.mentions ?? []).map((tag) => tag.petId)))];
  const hints = media.flatMap((slot) => (slot.mentions ?? []).map((tag) => ({ petId: tag.petId, userNo: tag.userNo ?? undefined, mentionId: tag.mentionId ?? undefined, petName: tag.petName ?? undefined, ownerNickname: tag.ownerNickname ?? undefined })));
  const labels = petIds.length ? await resolveFeedPetLabels(petIds, feed.userNo, feed.authorNickname ?? undefined, hints) : {};
  const items: WriteDraftItem[] = media.map((slot) => {
    const sourceUrl = resolveFileDisplayUrl(slot.file);
    if (!sourceUrl || slot.feedMediaId == null) throw new Error('원본 사진 정보를 불러오지 못했습니다.');
    return {
      id: `edit-${slot.feedMediaId}`, feedMediaId: slot.feedMediaId,
      kind: slot.mediaType === 'VIDEO' ? 'video' : 'image',
      fileName: `feed-${slot.feedMediaId}`, mimeType: slot.mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg', sourceUrl,
      petTags: (slot.mentions ?? []).map((tag) => ({
        id: `edit-${slot.feedMediaId}-${tag.petId}`, petId: tag.petId,
        petTag: tag.mentionId ? `@${tag.mentionId.replace(/^@/, '')}` : labels[tag.petId]?.label ?? `@${tag.petId}`,
        x: Number(tag.posX) / 100, y: Number(tag.posY) / 100,
      })),
    };
  });
  if (!items.length) throw new Error('수정할 사진이 없습니다.');
  return { items, caption: feed.content ?? '' };
}

export async function updateFeedFromDraft(feedId: string, caption: string, items: WriteDraftItem[]) {
  const mediaTags = items.map((item) => {
    if (item.feedMediaId == null) throw new Error('원본 사진 정보를 확인할 수 없습니다.');
    return {
      feedMediaId: item.feedMediaId,
      mentions: (item.petTags ?? []).map((tag) => {
        if (tag.petId == null) throw new Error('사진 태그 정보를 확인할 수 없습니다.');
        return { petId: tag.petId, posX: Math.round(tag.x * 10000) / 100, posY: Math.round(tag.y * 10000) / 100 };
      }),
    };
  });
  const tagIds = await resolveCaptionTagIds(caption);
  return bffPatchJson(bffEndpoints.feeds.detail, { feedId, content: caption.trim(), clearContent: !caption.trim(), mediaTags, tagIds });
}
