import type { FileSummary } from '@/types/file';
export function adminProfileUrl(
  userNo: number,
  file: FileSummary | null | undefined,
): string | null {
  if (!file) return null;
  if (/^https?:\/\//i.test(file.filePath)) return file.filePath;
  return `/api/admin/users/${userNo}/files/${file.fileId}/content`;
}
