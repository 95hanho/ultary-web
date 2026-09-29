import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { isRecord } from '@/lib/api/error';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope } from '@/types/api';
import type { FileSummary } from '@/types/file';

export type FeedPetLabel = {
  label: string;
  imageUrl: string;
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

function absorb(raw: unknown) {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
      : isRecord(raw) && Array.isArray(raw.content)
        ? raw.content
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
    byPetId.set(item.petId, {
      label,
      imageUrl: resolveFileDisplayUrl(asFile(item.profileFile)) ?? NO_PROFILE_SRC,
    });
  }
}

function loadMine() {
  if (!mineLoad) {
    mineLoad = bffGet<BffEnvelope<unknown>>(bffEndpoints.pets.root)
      .then((res) => absorb(res.data))
      .catch(() => undefined);
  }
  return mineLoad;
}

function loadUser(userNo: number) {
  let pending = userLoads.get(userNo);
  if (!pending) {
    pending = bffGet<BffEnvelope<unknown>>(bffEndpoints.users.pets, { userNo })
      .then((res) => absorb(res.data))
      .catch(() => undefined);
    userLoads.set(userNo, pending);
  }
  return pending;
}

/** 사진 태그 petId → @mention · 프로필. 작성자 펫과 내 펫에서 찾는다 */
export async function resolveFeedPetLabels(
  petIds: number[],
  authorUserNo?: number,
): Promise<Record<number, FeedPetLabel>> {
  const missing = petIds.filter((id) => !byPetId.has(id));
  if (missing.length > 0) {
    const jobs = [loadMine()];
    if (authorUserNo != null) jobs.push(loadUser(authorUserNo));
    await Promise.all(jobs);
  }
  const found: Record<number, FeedPetLabel> = {};
  for (const id of petIds) {
    const label = byPetId.get(id);
    if (label) found[id] = label;
  }
  return found;
}
