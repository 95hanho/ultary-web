'use client';

import { useEffect, useState } from 'react';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope } from '@/types/api';

export type AccountListMode = 'DM' | 'STORY_TAG' | 'FEED_TAG';
export type RankedAccount = {
  userNo: number;
  nickname: string;
  imageUrl: string;
  petTags: string[];
  pets: { petId: number; petTag: string }[];
  dmRoomId: string | null;
  following: boolean;
  followedBy: boolean;
};

function readAccounts(raw: unknown): RankedAccount[] {
  const items = isRecord(raw) && Array.isArray(raw.items) ? raw.items : [];
  return items.flatMap((item) => {
    if (!isRecord(item) || typeof item.userNo !== 'number' || typeof item.nickname !== 'string')
      return [];
    const pets = Array.isArray(item.pets)
      ? item.pets.flatMap((pet) => {
          if (!isRecord(pet) || typeof pet.petId !== 'number' || typeof pet.mentionId !== 'string')
            return [];
          return [{ petId: pet.petId, petTag: `@${pet.mentionId.replace(/^@+/, '')}` }];
        })
      : [];
    const file =
      isRecord(item.profileFile) && typeof item.profileFile.filePath === 'string'
        ? { fileId: Number(item.profileFile.fileId) || 0, filePath: item.profileFile.filePath }
        : null;
    return [
      {
        userNo: item.userNo,
        nickname: item.nickname,
        imageUrl: resolveFileDisplayUrl(file) ?? NO_PROFILE_SRC,
        petTags: pets.map((pet) => pet.petTag),
        pets,
        dmRoomId:
          typeof item.dmRoomId === 'number' || typeof item.dmRoomId === 'string'
            ? String(item.dmRoomId)
            : null,
        following: item.following === true,
        followedBy: item.followedBy === true,
      },
    ];
  });
}

/** Shared ranked source. The server searches before limiting; obsolete responses are ignored. */
export function useRankedAccounts(mode: AccountListMode, enabled: boolean, query: string) {
  const key = `${mode}:${query}`;
  const [result, setResult] = useState<{
    key: string;
    status: 'ready' | 'error';
    items: RankedAccount[];
  } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        try {
          const response = await bffGet<BffEnvelope<unknown>>(bffEndpoints.dm.shareTargets, {
            mode,
            q: query,
            limit: 50,
          });
          if (!cancelled) setResult({ key, status: 'ready', items: readAccounts(response.data) });
        } catch {
          if (!cancelled) setResult({ key, status: 'error', items: [] });
        }
      },
      query.trim() ? 250 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, enabled, query, key]);
  return result?.key === key ? result : { status: 'loading' as const, items: [] };
}
