import type { DateTimeString, Flag } from './common';
import type { NotificationType } from './enums';
import type { FileSummary } from './file';

/** GET /notifications items. 이동은 feedId·feedCommentId·feedReplyId */
export type Notification = {
  notificationId: number;
  type: NotificationType;
  message?: string | null;
  actorUserNo: number | null;
  actorNickname?: string | null;
  actorProfileFile?: FileSummary | null;
  actorCount?: number | null;
  snippet?: string | null;
  feedId: number | null;
  feedCommentId: number | null;
  feedReplyId: number | null;
  storyId?: number | null;
  neighborId: number | null;
  neighborStatus?: string | null;
  hasComment?: boolean | null;
  hasReply?: boolean | null;
  read?: boolean | null;
  updatedAt?: DateTimeString | null;
  /** 이전 응답 */
  content?: string | null;
  isRead?: Flag;
  createdAt?: DateTimeString;
};
