import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { isRecord } from '@/lib/api/error';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope, MeResponse } from '@/types/api';
import type { FileSummary } from '@/types/file';

export type FeedPetLabel = {
  label: string;
  imageUrl: string;
  /** 보호자 닉네임. 있으면 그 울타리로 이동 */
  ownerNickname?: string;
  userNo?: number;
};

const byPetId = new Map<number, FeedPetLabel>();
const userLoads = new Map<number, Promise<void>>();
let mineLoad: Promise<void> | null = null;

function asFile(value: unknown): Pick<FileSummary, 'fileId' | 'filePath'> | null {
  if (!isRecord(value)) return null;
  if (typeof value.filePath !== 'string' || !value.filePath.trim()) return null;
  return {
    fileId: typeof value.fileId === 'number' ? value.fileId : 0,
    filePath: value.filePath,
  };
}

function readOwnerNickname(item: Record<string, unknown>, fallback?: string) {
  if (typeof item.ownerNickname === 'string' && item.ownerNickname.trim()) {
    return item.ownerNickname.trim();
  }
  if (isRecord(item.owner) && typeof item.owner.nickname === 'string' && item.owner.nickname.trim()) {
    return item.owner.nickname.trim();
  }
  const nick = fallback?.trim();
  return nick || undefined;
}

function absorb(raw: unknown, ownerNickname?: string) {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
    : isRecord(raw) && Array.isArray(raw.content)
      ? raw.content
      : isRecord(raw) && Array.isArray(raw.pets)
        ? raw.pets
        : [];
  for (const item of list) {
    if (!isRecord(item) || typeof item.petId !== 'number') continue;
    const mention = typeof item.mentionId === 'string' ? item.mentionId.trim() : '';
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const label = mention
      ? mention.startsWith('@')
        ? mention
        : `@${mention}`
      : name;
    if (!label) continue;
    const prev = byPetId.get(item.petId);
    byPetId.set(item.petId, {
      label,
      imageUrl: resolveFileDisplayUrl(asFile(item.profileFile)) ?? NO_PROFILE_SRC,
      ownerNickname: readOwnerNickname(item, ownerNickname) ?? prev?.ownerNickname,
      userNo: typeof item.userNo === 'number' ? item.userNo : prev?.userNo,
    });
  }
}

function loadMine() {
  if (!mineLoad) {
    mineLoad = Promise.all([
      bffGet<BffEnvelope<unknown>>(bffEndpoints.pets.root),
      bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me).catch(() => null),
    ])
      .then(([petsRes, meRes]) => {
        absorb(petsRes.data, meRes?.data?.nickname);
      })
      .catch(() => undefined);
  }
  return mineLoad;
}

function loadUser(userNo: number, ownerNickname?: string) {
  let pending = userLoads.get(userNo);
  if (!pending) {
    pending = (async () => {
      let nick = ownerNickname?.trim() || undefined;
      if (!nick) {
        const ultary = await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.ultary, {
          userNo,
        }).catch(() => null);
        const data = ultary?.data;
        if (isRecord(data) && typeof data.nickname === 'string' && data.nickname.trim()) {
          nick = data.nickname.trim();
        }
      }
      const pets = await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.pets, { userNo });
      absorb(pets.data, nick);
    })().catch(() => undefined);
    userLoads.set(userNo, pending);
  }
  return pending;
}

async function loadBySearch(query: string) {
  const q = query.trim().replace(/^@/, '');
  if (!q) return;
  const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
    q,
    type: 'PET',
  });
  absorb(res.data);
}

export type FeedPetHint = {
  petId: number;
  userNo?: number;
  mentionId?: string;
  petName?: string;
  ownerNickname?: string;
};

/** 사진 태그 petId → @mention · 프로필 · 보호자 닉네임 */
export async function resolveFeedPetLabels(
  petIds: number[],
  authorUserNo?: number,
  authorNickname?: string,
  hints: FeedPetHint[] = [],
): Promise<Record<number, FeedPetLabel>> {
  const missing = petIds.filter((id) => !byPetId.has(id));
  if (missing.length > 0) {
    const jobs = [loadMine()];
    if (authorUserNo != null) jobs.push(loadUser(authorUserNo, authorNickname));
    const hintedUsers = new Set<number>();
    for (const hint of hints) {
      if (hint.userNo == null || byPetId.has(hint.petId)) continue;
      hintedUsers.add(hint.userNo);
    }
    for (const userNo of hintedUsers) {
      if (userNo !== authorUserNo) jobs.push(loadUser(userNo));
    }
    await Promise.all(jobs);

    const searches = new Set<string>();
    for (const hint of hints) {
      if (byPetId.has(hint.petId)) continue;
      if (hint.mentionId) searches.add(hint.mentionId);
      else if (hint.petName) searches.add(hint.petName);
    }
    await Promise.all([...searches].map((query) => loadBySearch(query).catch(() => undefined)));

    const nickUsers = new Set<number>();
    for (const id of petIds) {
      const label = byPetId.get(id);
      if (label && !label.ownerNickname && label.userNo != null) nickUsers.add(label.userNo);
    }
    if (nickUsers.size > 0) {
      await Promise.all([...nickUsers].map((userNo) => loadUser(userNo)));
    }

    for (const hint of hints) {
      if (byPetId.has(hint.petId) || !hint.ownerNickname) continue;
      byPetId.set(hint.petId, {
        label: hint.mentionId
          ? hint.mentionId.startsWith('@')
            ? hint.mentionId
            : `@${hint.mentionId}`
          : '태그',
        imageUrl: NO_PROFILE_SRC,
        ownerNickname: hint.ownerNickname,
      });
    }
  }
  const found: Record<number, FeedPetLabel> = {};
  for (const id of petIds) {
    const label = byPetId.get(id);
    if (label) found[id] = label;
  }
  return found;
}
