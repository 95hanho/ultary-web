import type { DateTimeString, SoftDelete, Timestamps } from './common';

/** ultary_tag */
export type Tag = {
  tagId: number;
  name: string;
  title: string | null;
  content: string | null;
  link: string | null;
  useCount: number;
  createdByUserNo: number | null;
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
