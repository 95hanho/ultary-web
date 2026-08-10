import type { DateTimeString, Flag, SoftDelete, Timestamps } from './common';
import type { WithdrawalStatus } from './enums';
import type { SocialProvider } from './api';

/** ultary_user — password / loginId 없음 (소셜 우선) */
export type User = {
  userNo: number;
  name: string | null;
  nickname: string;
  isDefaultNickname: Flag;
  email: string | null;
  phone: string | null;
  profileFileId: number | null;
  bio: string | null;
  regionSido: string | null;
  regionSigungu: string | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  withdrawalStatus: WithdrawalStatus;
  withdrawalRequestedAt: DateTimeString | null;
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
