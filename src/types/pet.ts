import type { DateTimeString, Flag, SoftDelete, Timestamps } from './common';
import type { PetGender, PetSpecies } from './enums';
import type { FileSummary } from './file';

/** ultary_pet */
export type Pet = {
  petId: number;
  userNo: number;
  name: string;
  species: PetSpecies;
  breed: string | null;
  gender: PetGender;
  isNeutered: Flag;
  birthday: DateTimeString | null;
  profileFileId: number | null;
  /** 읽기 응답 임베드 */
  profileFile?: FileSummary | null;
  bio: string | null;
} & Timestamps &
  SoftDelete;
