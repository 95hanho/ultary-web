import { isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import type { SearchAccount } from '@/lib/mock/search';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { FileSummary } from '@/types/file';

function asFile(value: unknown): Pick<FileSummary, 'fileId' | 'filePath'> | null {
  if (!isRecord(value)) return null;
  if (typeof value.filePath !== 'string' || !value.filePath.trim()) return null;
  return {
    fileId: typeof value.fileId === 'number' ? value.fileId : 0,
    filePath: value.filePath,
  };
}

function pickNickname(raw: Record<string, unknown>): string | null {
  if (typeof raw.nickname === 'string' && raw.nickname.trim()) return raw.nickname.trim();
  return null;
}

function pickUserNo(raw: Record<string, unknown>): number | null {
  if (typeof raw.userNo === 'number') return raw.userNo;
  if (typeof raw.targetUserNo === 'number') return raw.targetUserNo;
  return null;
}

function mentionLabel(value: string): string {
  const name = value.trim().replace(/^@+/, '');
  return name ? `@${name}` : '';
}

function pickPetTags(raw: Record<string, unknown>): string[] {
  const source = Array.isArray(raw.petTags)
    ? raw.petTags
    : Array.isArray(raw.pets)
      ? raw.pets
      : [];
  return source
    .map((pet) => {
      if (typeof pet === 'string') return mentionLabel(pet);
      if (!isRecord(pet)) return '';
      const name =
        (typeof pet.mentionId === 'string' && pet.mentionId) ||
        (typeof pet.petName === 'string' && pet.petName) ||
        (typeof pet.name === 'string' && pet.name) ||
        '';
      return mentionLabel(name);
    })
    .filter(Boolean);
}

function toAccount(raw: unknown): SearchAccount | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.type === 'string' && raw.type !== 'USER') return null;
  const userNo = pickUserNo(raw);
  const nickname = pickNickname(raw);
  if (userNo == null || !nickname) return null;
  return {
    id: String(userNo),
    userNo,
    nickname,
    imageUrl: resolveFileDisplayUrl(asFile(raw.profileFile)) ?? NO_PROFILE_SRC,
    petTags: pickPetTags(raw),
  };
}

function listFrom(raw: unknown, keys: string[]): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
  }
  if (isRecord(raw.data)) return listFrom(raw.data, keys);
  return [];
}

/** GET /main/search/recent 의 items */
export function mapRecentAccounts(raw: unknown): SearchAccount[] {
  return listFrom(raw, ['items', 'content', 'list'])
    .map(toAccount)
    .filter((account): account is SearchAccount => account != null);
}

/** GET /main/search?type=USER|MENTION 의 유저 목록 */
export function mapSearchUsers(raw: unknown): SearchAccount[] {
  return listFrom(raw, ['users', 'userList', 'items', 'content', 'list'])
    .map(toAccount)
    .filter((account): account is SearchAccount => account != null);
}

export type SearchTagHit = {
  tagId: number;
  /** `#` 포함 */
  tag: string;
  postCount: number;
};

/** GET /main/search?type=TAG 의 tags */
export function mapSearchTags(raw: unknown): SearchTagHit[] {
  return listFrom(raw, ['tags'])
    .map((item) => {
      if (!isRecord(item) || typeof item.tagId !== 'number') return null;
      const hashtag =
        typeof item.hashtag === 'string' ? item.hashtag.trim().replace(/^#/, '') : '';
      if (!hashtag) return null;
      return {
        tagId: item.tagId,
        tag: `#${hashtag}`,
        postCount: typeof item.feedCount === 'number' ? item.feedCount : 0,
      };
    })
    .filter((tag): tag is SearchTagHit => tag != null);
}
