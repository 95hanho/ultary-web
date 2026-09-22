import type { DateTimeString, SoftDelete, Timestamps } from './common';
import type { FileSummary } from './file';

/** 스토리 미디어 타입 */
export type StoryMediaType = 'IMAGE' | 'VIDEO';

/**
 * GET /main/stories/owners
 * 링 메타만 — FileSummary / 프로필 URL 없음. 미디어는 GET /main/stories?userNo=
 */
export type StoryOwner = {
  userNo: number;
  nickname: string;
  /** ultary_story_view 기준 안 읽은 활성 스토리 여부 */
  hasUnviewed: boolean;
};

/**
 * GET /main/stories?userNo= · GET /my-ultary/stories
 * FileSummary 임베드
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
  expiresAt: DateTimeString;
  createdAt: DateTimeString;
} & SoftDelete;

/** POST /my-ultary/stories 등록 요청은 fileId만 (multipart 또는 form) */
export type CreateStoryRequest = {
  fileId: number;
  mediaType: StoryMediaType;
  caption?: string | null;
};

/** DB ultary_story_view (참고) */
export type StoryView = {
  storyId: number;
  viewerUserNo: number;
  viewedAt: DateTimeString;
} & Timestamps;
