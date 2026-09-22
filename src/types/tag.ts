import type { DateTimeString, SoftDelete, Timestamps } from './common';
import type { FileSummary } from './file';

/** ultary_tag */
export type Tag = {
  tagId: number;
  name: string;
  title: string | null;
  content: string | null;
  link: string | null;
  useCount: number;
  createdByUserNo: number | null;
  /** 읽기 응답 — 기존 imageFileIds와 함께 */
  imageFileIds?: number[];
  images?: FileSummary[];
} & Timestamps &
  SoftDelete;

/** ultary_feed_tag */
export type FeedTag = {
  feedTagId: number;
  feedId: number;
  tagId: number;
  createdAt: DateTimeString;
} & SoftDelete;

/** ultary_tag_image */
export type TagImage = {
  tagImageId: number;
  tagId: number;
  fileId: number;
  sortOrder: number;
} & Timestamps;
