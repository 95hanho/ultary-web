import type { FileSummary } from '@/types/file';

export type AdminUser = {
  userNo: number;
  nickname: string;
  petNames: string[];
  name: string | null;
  status: string;
  maskedEmail: string | null;
  maskedPhone: string | null;
  createdAt: string;
  suspendedAt: string | null;
  withdrawalCompletedAt: string | null;
  petCount: number;
  feedCount: number;
  reportCount: number;
  googleLinked: boolean;
  kakaoLinked: boolean;
  profileFile: FileSummary | null;
};
export type AdminUserDetail = {
  user: AdminUser;
  pets: {
    petId: number;
    name: string;
    species: string;
    breed?: string;
    gender: string;
    profileFile?: FileSummary | null;
  }[];
  feeds: {
    feedId: number;
    content: string;
    visibility: string;
    deleted: boolean;
    createdAt: string;
  }[];
  reports: {
    reportId: number;
    targetType: string;
    status: string;
    reason: string;
    createdAt: string;
  }[];
};
export type AdminAction = {
  actionLogId: number;
  adminNo: number;
  adminLoginId: string;
  adminName: string | null;
  action: string;
  targetType: string;
  targetId: number;
  requestId: number | null;
  targetLabel: string | null;
  beforeStatus: string | null;
  afterStatus: string | null;
  reason: string | null;
  sample: boolean;
  createdAt: string;
};
export type AdminPage<T> = { items: T[]; totalCount: number; page: number; pageSize: number };
export const USER_STATUS: Record<string, string> = {
  ACTIVE: '정상',
  SUSPENDED: '정지',
  WITHDRAWN: '탈퇴',
};
export const ACTION_KIND: Record<string, string> = {
  USER: '회원',
  TAG: '태그',
  REPORT: '신고',
  AI_REVIEW: 'AI 조치',
};
export const ACTION_NAME: Record<string, string> = {
  USER_SUSPENDED: '회원 정지',
  USER_UNSUSPENDED: '정지 해제',
  TAG_APPROVED: '태그 승인',
  TAG_REJECTED: '태그 거절',
  TAG_PENDING: '태그 대기',
  REPORT_DELETED: '신고 대상 삭제',
  REPORT_SUSPENDED: '신고 회원 정지',
  REPORT_CONFIRMED: '신고 확인',
  REPORT_REJECTED: '신고 거절',
  AI_REVIEW: 'AI 오류 조치',
};
export const ACTION_STATUS: Record<string, string> = {
  ...USER_STATUS,
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
  REQUESTED: '요청',
  CONFIRMED: '확인',
  DELETED: '삭제',
  KEPT: '유지',
};
export function actionHref(action: AdminAction): string {
  if (action.targetType === 'USER') return `/admin/users/${action.targetId}`;
  if (action.targetType === 'REPORT') return `/admin/reports/${action.targetId}`;
  if (action.targetType === 'AI_REVIEW') return `/admin/ai/logs/${action.targetId}`;
  return '/admin/tags';
}
