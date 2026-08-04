import type { DateTimeString, Timestamps } from './common';
import type { ReportStatus, ReportTargetType } from './enums';

/** ultary_report */
export type Report = {
  reportId: number;
  reporterUserNo: number;
  targetType: ReportTargetType;
  targetUserNo: number | null;
  targetPetId: number | null;
  targetFeedId: number | null;
  targetCommentId: number | null;
  targetReplyId: number | null;
  reason: string;
  status: ReportStatus;
  adminNo: number | null;
  processedAt: DateTimeString | null;
} & Timestamps;
