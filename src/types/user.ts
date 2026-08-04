import type { DateTimeString, SoftDelete, Timestamps } from './common';
import type { WithdrawalStatus } from './enums';

/** ultary_user — password는 클라이언트 엔티티에서 제외 */
export type User = {
  userNo: number;
  loginId: string;
  name: string | null;
  nickname: string;
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

/** ultary_user_block */
export type UserBlock = {
  userBlockId: number;
  blockerUserNo: number;
  blockedUserNo: number;
  reason: string | null;
  createdAt: DateTimeString;
} & SoftDelete;
