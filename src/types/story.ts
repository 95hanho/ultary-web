import type { DateTimeString, SoftDelete, Timestamps } from './common';
import type { FileSummary } from './file';

/** 스토리 미디어 타입 */
export type StoryMediaType = 'IMAGE' | 'VIDEO';

/**
 * GET /main/stories/owners
 * 링 메타 + 유저 프로필. 스토리 미디어는 GET /main/stories?userNo=
 */
export type StoryOwner = {
  userNo: number;
  nickname: string;
  /** ultary_story_view 기준 안 읽은 활성 스토리 여부 */
  hasUnviewed: boolean;
  /** 유저 프로필. 미등록이면 null */
  profileFile?: FileSummary | null;
};

/**
 * GET /main/stories?userNo= · GET /my-ultary/stories
 * FileSummary 임베드 + 단건 읽음 여부
 */
export type Story = {
  storyId: number;
  userNo: number;
  mediaType: StoryMediaType;
  fileId: number;
  thumbnailFileId?: number | null;
  file?: FileSummary | null;
  thumbnailFile?: FileSummary | null;
  authorProfileFile?: FileSummary | null;
  /** 작성자 표시명 (있으면 사용) */
  nickname?: string | null;
  authorNickname?: string | null;
  /**
   * 현재 로그인 유저가 이 스토리를 읽었는지 (`ultary_story_view`).
   * share: FE는 첫 false부터 재생, 전부 true면 index 0.
   */
  viewedByMe: boolean;
  /** 사진 위 글자. 없으면 빈 배열 */
  texts?: StoryText[];
  /** 사진 위 펫 멘션. 없으면 빈 배열 */
  mentions?: StoryMention[];
  expiresAt: DateTimeString;
  createdAt: DateTimeString;
} & SoftDelete;

export type StoryText = {
  content: string;
  fontSize: number;
  bold: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;
  posX: number;
  posY: number;
};

export type StoryMention = {
  petId: number;
  mentionId?: string | null;
  petName?: string | null;
  posX: number;
  posY: number;
};

/** POST /my-ultary/stories — 파일 업로드 후 fileId와 사진 위 글자·멘션 */
export type CreateStoryRequest = {
  fileId: number;
  mediaType: StoryMediaType;
  texts: StoryText[];
  mentions: Array<Pick<StoryMention, 'petId' | 'posX' | 'posY'>>;
};

/** DB ultary_story_view (참고) */
export type StoryView = {
  storyId: number;
  viewerUserNo: number;
  viewedAt: DateTimeString;
} & Timestamps;
