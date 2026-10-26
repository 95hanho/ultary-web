import 'server-only';
import {cache} from 'react';
import { springGet } from '@/lib/api/springFetch';
import { springEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import type { FeedDetailResponse } from '@/types/feed';
// Request-local deduplication only. Never forward member credentials or rotate tokens.
export const loadPublicFeed = cache(async (feedId: string): Promise<FeedDetailResponse> => {
  const raw = await springGet<unknown>(springEndpoints.feeds.detail, { feedId }, undefined, {
    recoverExpiredAccess: false,
  });
  if (!isRecord(raw) || raw.feedId !== Number(feedId) || raw.visibility !== 'PUBLIC')
    throw new Error('공개 게시글을 불러오지 못했습니다.');
  return raw as FeedDetailResponse;
});
