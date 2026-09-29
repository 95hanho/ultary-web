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

function pickPetTags(raw: Record<string, unknown>): string[] {
  const source = Array.isArray(raw.petTags)
    ? raw.petTags
    : Array.isArray(raw.pets)
      ? raw.pets
      : [];
  return source
    .map((pet) => {
      if (typeof pet === 'string') return pet;
      if (!isRecord(pet)) return '';
      const name =
        (typeof pet.mentionId === 'string' && pet.mentionId) ||
        (typeof pet.petName === 'string' && pet.petName) ||
        (typeof pet.name === 'string' && pet.name) ||
        '';
      if (!name) return '';
      return name.startsWith('@') ? name : `@${name}`;
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

/** GET /main/search?type=USER 의 유저 목록 */
export function mapSearchUsers(raw: unknown): SearchAccount[] {
  return listFrom(raw, ['users', 'userList', 'items', 'content', 'list'])
    .map(toAccount)
    .filter((account): account is SearchAccount => account != null);
}
