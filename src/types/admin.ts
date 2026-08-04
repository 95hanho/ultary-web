import type { DateTimeString, Timestamps } from './common';
import type { AdminRole, AdminStatus } from './enums';

/** ultary_admin — password는 클라이언트 엔티티에서 제외 */
export type Admin = {
  adminNo: number;
  loginId: string;
  name: string | null;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt: DateTimeString | null;
} & Timestamps;
