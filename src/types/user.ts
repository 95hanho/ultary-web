import type { DateTimeString, Flag, SoftDelete, Timestamps } from './common';
import type { WithdrawalStatus } from './enums';
import type { SocialProvider } from './api';
import type { FileSummary } from './file';

/** ultary_user — password / loginId 없음 (소셜 우선) */
export type User = {
  userNo: number;
  name: string | null;
  nickname: string;
  isDefaultNickname: Flag;
  email: string | null;
  phone: string | null;
  /** 대표 펫 사진. 유저 컬럼이 아니며, 없으면 null */
  profileFile?: FileSummary | null;
  bio: string | null;
  regionSido: string | null;
  regionSigungu: string | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  withdrawalStatus: WithdrawalStatus;
  withdrawalCompletedAt: DateTimeString | null;
};

/** ultary_user_social */
export type UserSocial = {
  userSocialId: number;
  userNo: number;
  provider: SocialProvider;
  providerUserId: string;
  providerEmail: string | null;
  linkedAt: DateTimeString;
} & Timestamps;

/** ultary_user_block */
export type UserBlock = {
  userBlockId: number;
  blockerUserNo: number;
  blockedUserNo: number;
  reason: string | null;
  createdAt: DateTimeString;
} & SoftDelete;
