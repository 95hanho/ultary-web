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
  pinCount: number;
} & Timestamps &
  SoftDelete;

/** 피드 상세·타임라인 읽기 응답 (media 임베드) */
export type FeedDetailResponse = Feed & {
  media?: FeedMediaFileEmbed[];
  /** 작성자의 대표 펫 사진. 없으면 null */
  authorProfileFile?: FileSummary | null;
  /** 작성자 프로필. owners와 같이 `profileFile`로 올 수도 있음 */
  profileFile?: FileSummary | null;
  /** 작성자 표시명 — Spring 게스트 단건에도 포함 (spring-auth-api.md) */
  nickname?: string | null;
  authorNickname?: string | null;
  /** 현재 로그인 유저가 이 글을 울타리에 고정했는지 */
  pinnedByMe?: boolean;
  /** 현재 로그인 유저가 나만 보기로 저장했는지 */
  savedByMe?: boolean;
  /** 현재 로그인 유저가 이 게시글을 좋아요 했는지 */
  likedByMe?: boolean;
  /** 이 글에 연결된 태그 id */
  tagIds?: number[];
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
  likeCount: number;
  /** 현재 로그인 유저가 이 댓글을 좋아요 했는지 */
  likedByMe: boolean;
  authorNickname?: string | null;
  /** 작성자 프로필. 미등록이면 null */
  authorProfileFile?: FileSummary | null;
  replyCount?: number;
  replies?: FeedReply[];
} & Timestamps &
  SoftDelete;

/** ultary_feed_reply */
export type FeedReply = {
  feedReplyId: number;
  feedCommentId: number;
  userNo: number;
  content: string;
  likeCount: number;
  /** 현재 로그인 유저가 이 답글을 좋아요 했는지 */
  likedByMe: boolean;
  authorNickname?: string | null;
  /** 작성자 프로필. 미등록이면 null */
  authorProfileFile?: FileSummary | null;
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

/** ultary_feed_pin. 울타리에 보이는 고정 */
export type FeedPin = {
  feedPinId: number;
  feedId: number;
  userNo: number;
  createdAt: DateTimeString;
} & SoftDelete;

/** ultary_feed_save. 목록은 본인만 */
export type FeedSave = {
  feedSaveId: number;
  feedId: number;
  userNo: number;
  createdAt: DateTimeString;
} & SoftDelete;
