import type { DateTimeString, Flag, SoftDelete, Timestamps } from './common';
import type { PetGender, PetSpecies } from './enums';
import type { FileSummary } from './file';

/** ultary_pet */
export type Pet = {
  petId: number;
  userNo: number;
  mentionId?: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  gender: PetGender;
  isNeutered: Flag;
  birthday: DateTimeString | null;
  profileFileId: number | null;
  /** 읽기 응답 임베드 */
  profileFile?: FileSummary | null;
  /** 작을수록 우선. 첫 번째 활성 펫이 대표 프로필이며 사진이 없으면 기본 이미지 */
  priority: number;
  bio: string | null;
} & Timestamps &
  SoftDelete;

export type SubjectPet = { petId: number; name: string; profileFile?: FileSummary | null };
