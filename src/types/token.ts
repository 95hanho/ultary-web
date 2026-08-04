import type { DateTimeString, Flag, Timestamps } from './common';
import type { TokenOwnerType } from './enums';

/**
 * ultary_token — refreshToken은 클라이언트 엔티티에서 제외.
 * 쿠키/헤더로만 다루는 전제.
 */
export type Token = {
  tokenId: number;
  ownerType: TokenOwnerType;
  userNo: number | null;
  adminNo: number | null;
  connectIp: string | null;
  connectAgent: string | null;
  expiresAt: DateTimeString;
  isRevoked: Flag;
  revokedAt: DateTimeString | null;
} & Timestamps;
