import type { DateTimeString, SoftDelete } from './common';

/** ultary_file */
export type FileMeta = {
  fileId: number;
  originalName: string | null;
  storeName: string;
  extension: string | null;
  mimeType: string | null;
  fileSize: number | null;
  filePath: string;
  copyright: string | null;
  copyrightUrl: string | null;
  uploadedByUserNo: number | null;
  uploadedByAdminNo: number | null;
  createdAt: DateTimeString;
} & SoftDelete;
