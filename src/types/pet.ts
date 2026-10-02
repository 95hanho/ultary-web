import type { DateTimeString, Flag, SoftDelete, Timestamps } from './common';
import type { PetGender, PetSpecies } from './enums';
import type { FileSummary } from './file';

/** ultary_pet */
export type Pet = {
  petId: number;
  userNo: number;
  mentionId: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  gender: PetGender;
  isNeutered: Flag;
  birthday: DateTimeString | null;
  profileFileId: number | null;
  /** 읽기 응답 임베드 */
  profileFile?: FileSummary | null;
  /** 작을수록 우선. 1이 가장 높음. 사진 있는 펫 중 가장 높은 값이 유저 프로필 사진 */
  priority: number;
  bio: string | null;
} & Timestamps &
  SoftDelete;
