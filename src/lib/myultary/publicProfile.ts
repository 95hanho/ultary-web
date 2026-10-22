import 'server-only';
import { cache } from 'react';
import { springGet } from '@/lib/api/springFetch';
import { isRecord } from '@/lib/api/error';
import { mapFeedGrid, mapMyPets, mapMyUltaryProfile } from './fromApi';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { PublicUltaryView } from '@/types/public-ultary';

// React cache only deduplicates metadata/page reads within one render request.
export const loadPublicUltary = cache(async (nickname: string): Promise<PublicUltaryView> => {
  const raw = await springGet<unknown>('/api/v1/public/ultaries/:nickname', { nickname }, undefined, { recoverExpiredAccess: false });
  const profile = mapMyUltaryProfile(raw);
  if (!isRecord(raw) || !profile) throw new Error('공개 울타리를 불러오지 못했습니다.');
  const sharedHref = (id: string) => `/feeds/${id}`;
  return { profile, pets: mapMyPets(raw.pets, NO_PROFILE_SRC),
    feeds: mapFeedGrid(raw.feeds, sharedHref), pinned: mapFeedGrid(raw.pinnedFeeds, sharedHref),
    tagged: mapFeedGrid(raw.taggedFeeds, sharedHref) };
});

