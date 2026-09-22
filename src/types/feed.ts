import type { DateTimeString, Flag, SoftDelete, Timestamps } from './common';
import type { FeedPetStatus, FeedVisibility } from './enums';
import type { FeedCoverFileEmbed, FeedMediaFileEmbed, FileSummary } from './file';

/** ultary_feed */
export type Feed = {
  feedId: number;
  userNo: number;
  content: string | null;
  visibility: FeedVisibility;
  likeCount: number;
  commentCount: number;
  storeCount: number;
} & Timestamps &
  SoftDelete;

/** 피드 상세·타임라인 읽기 응답 (media 임베드) */
export type FeedDetailResponse = Feed & {
  media?: FeedMediaFileEmbed[];
  authorProfileFile?: FileSummary | null;
  /** 작성자 표시명 — Spring 게스트 단건에도 포함 (spring-auth-api.md) */
  nickname?: string | null;
  authorNickname?: string | null;
} & FeedCoverFileEmbed;

/** 피드 그리드 읽기 응답 */
export type FeedGridItem = {
  feedId: number;
} & FeedCoverFileEmbed;

/** ultary_feed_pet */
export type FeedPet = {
  feedPetId: number;
  feedId: number;
  petId: number;
  addedByUserNo: number;
  status: FeedPetStatus;
  approvedByUserNo: number | null;
  approvedAt: DateTimeString | null;
  rejectedAt: DateTimeString | null;
  isMain: Flag;
} & Timestamps;

/** @deprecated schema v3+ 는 feed_media — FeedMediaFileEmbed 참고 */
export type FeedImage = {
  feedImageId: number;
  feedId: number;
  fileId: number;
  sortOrder: number;
} & Timestamps;

/** ultary_feed_like */
export type FeedLike = {
  feedLikeId: number;
  feedId: number;
  userNo: number;
  createdAt: DateTimeString;
} & SoftDelete;

/** ultary_feed_comment */
export type FeedComment = {
  feedCommentId: number;
  feedId: number;
  userNo: number;
  content: string;
} & Timestamps &
  SoftDelete;

/** ultary_feed_reply */
export type FeedReply = {
  feedReplyId: number;
  feedCommentId: number;
  userNo: number;
  content: string;
} & Timestamps &
  SoftDelete;

/** ultary_feed_comment_mention */
export type FeedCommentMention = {
  feedCommentMentionId: number;
  feedCommentId: number | null;
  feedReplyId: number | null;
  mentionedUserNo: number | null;
  mentionedPetId: number | null;
  createdAt: DateTimeString;
};

/** ultary_feed_store */
export type FeedStore = {
  feedStoreId: number;
  feedId: number;
  userNo: number;
  createdAt: DateTimeString;
} & SoftDelete;
