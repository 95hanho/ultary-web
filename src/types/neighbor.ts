import type { DateTimeString, Timestamps } from './common';
import type { NeighborStatus } from './enums';

/** ultary_neighbor */
export type Neighbor = {
  neighborId: number;
  requesterUserNo: number;
  receiverUserNo: number;
  /** 작은 userNo:큰 userNo */
  pairKey: string;
  status: NeighborStatus;
  requestedAt: DateTimeString;
  acceptedAt: DateTimeString | null;
  rejectedAt: DateTimeString | null;
  blockedAt: DateTimeString | null;
} & Timestamps;
