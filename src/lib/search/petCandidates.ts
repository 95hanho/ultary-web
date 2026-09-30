import { isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import type { SearchAccount, SearchPetChoice } from '@/lib/mock/search';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { FileSummary } from '@/types/file';

type PetHit = {
  petId: number;
  userNo: number;
  mentionId: string;
  name: string;
  imageUrl: string;
};

function asFile(value: unknown): Pick<FileSummary, 'fileId' | 'filePath'> | null {
  if (!isRecord(value)) return null;
  if (typeof value.filePath !== 'string' || !value.filePath.trim()) return null;
  return {
    fileId: typeof value.fileId === 'number' ? value.fileId : 0,
    filePath: value.filePath,
  };
}

function listOf(raw: unknown, key: string): unknown[] {
  if (!isRecord(raw)) return [];
  const value = raw[key];
  return Array.isArray(value) ? value : [];
}

function readPet(raw: unknown): PetHit | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.petId !== 'number' || typeof raw.userNo !== 'number') return null;
  const mentionId = typeof raw.mentionId === 'string' ? raw.mentionId.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!mentionId && !name) return null;
  return {
    petId: raw.petId,
    userNo: raw.userNo,
    mentionId,
    name,
    imageUrl: resolveFileDisplayUrl(asFile(raw.profileFile)) ?? NO_PROFILE_SRC,
  };
}

function mentionTag(mentionId: string): string {
  if (!mentionId) return '';
  return mentionId.startsWith('@') ? mentionId : `@${mentionId}`;
}

/**
 * GET /main/search?type=PET 의 pets.
 * 같은 질의의 USER 결과가 있으면 보호자 닉네임을 붙인다.
 * 펫 응답에는 닉네임이 없다.
 */
export function mapPetCandidates(petData: unknown, userData: unknown): SearchAccount[] {
  const pets = listOf(petData, 'pets').map(readPet).filter((pet): pet is PetHit => pet != null);
  const nickByUser = new Map<number, { nickname: string; imageUrl: string }>();
  for (const raw of listOf(userData, 'users')) {
    if (!isRecord(raw) || typeof raw.userNo !== 'number') continue;
    const nickname = typeof raw.nickname === 'string' ? raw.nickname.trim() : '';
    if (!nickname) continue;
    nickByUser.set(raw.userNo, {
      nickname,
      imageUrl: resolveFileDisplayUrl(asFile(raw.profileFile)) ?? NO_PROFILE_SRC,
    });
  }

  const groups = new Map<number, PetHit[]>();
  const order: number[] = [];
  for (const pet of pets) {
    const group = groups.get(pet.userNo);
    if (!group) {
      groups.set(pet.userNo, [pet]);
      order.push(pet.userNo);
      continue;
    }
    group.push(pet);
  }

  return order.map((userNo) => {
    const group = groups.get(userNo) ?? [];
    const owner = nickByUser.get(userNo);
    const choices: SearchPetChoice[] = group.flatMap((pet) => {
      const petTag = mentionTag(pet.mentionId);
      if (!petTag) return [];
      return [{ petId: pet.petId, petTag }];
    });
    return {
      id: `${userNo}-${group.map((pet) => pet.petId).join('-')}`,
      userNo,
      nickname: owner?.nickname || group[0]?.name || '펫',
      imageUrl: owner?.imageUrl || group[0]?.imageUrl || NO_PROFILE_SRC,
      petTags: choices.map((choice) => choice.petTag),
      petChoices: choices,
    };
  });
}
