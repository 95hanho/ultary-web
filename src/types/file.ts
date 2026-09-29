import type { DateTimeString, SoftDelete } from './common';
import type { FileSourceType } from './enums';

/**
 * 읽기 API 임베드 요약 (share/docs/API_CONTRACT.md FileSummary).
 * 피드·스토리·프로필·검색·태그 등에서 fileId와 함께 내려온다.
 */
export type FileSummary = {
  fileId: number;
  /** 상대경로(`images/…`) 또는 CDN 절대 URL */
  filePath: string;
  mimeType: string | null;
  extension: string | null;
  sourceType: FileSourceType | null;
  authorName: string | null;
  sourceUrl: string | null;
  licenseUrl: string | null;
  copyrightNotice: string | null;
};

/** ultary_file — 단건 메타(업로드·GET /files/{id}) */
export type FileMeta = {
  fileId: number;
  originalName: string | null;
  storeName: string;
  extension: string | null;
  mimeType: string | null;
  fileSize: number | null;
  filePath: string;
  sourceType: FileSourceType | null;
  authorName: string | null;
  sourceUrl: string | null;
  licenseUrl: string | null;
  copyrightNotice: string | null;
  uploadedByUserNo: number | null;
  uploadedByAdminNo: number | null;
  createdAt: DateTimeString;
} & SoftDelete;

/** 피드 media[] 항목 (읽기 응답) */
export type FeedMediaFileEmbed = {
  fileId: number;
  thumbnailFileId?: number | null;
  file?: FileSummary | null;
  thumbnailFile?: FileSummary | null;
  sortOrder?: number;
};

/** 피드 그리드 커버 (읽기 응답) */
export type FeedCoverFileEmbed = {
  coverFileId?: number | null;
  coverThumbnailFileId?: number | null;
  coverFile?: FileSummary | null;
  coverThumbnailFile?: FileSummary | null;
};
