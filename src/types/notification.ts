import type { DateTimeString, Flag } from './common';
import type { NotificationType } from './enums';

/** ultary_notification */
export type Notification = {
  notificationId: number;
  receiverUserNo: number;
  actorUserNo: number | null;
  type: NotificationType;
  feedId: number | null;
  feedPetId: number | null;
  feedCommentId: number | null;
  feedReplyId: number | null;
  neighborId: number | null;
  content: string | null;
  isRead: Flag;
  readAt: DateTimeString | null;
  createdAt: DateTimeString;
};
