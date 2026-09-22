import type { FileSummary } from '@/types/file';

/**
 * FileSummary.filePath → 브라우저 표시용 URL.
 * - `http(s)://` (CDN) → 그대로 사용
 * - 상대경로 → BFF `/api/files/{fileId}/content` 프록시
 */
export function resolveFileDisplayUrl(
  file: Pick<FileSummary, 'fileId' | 'filePath'> | null | undefined,
): string | null {
  if (!file?.filePath?.trim()) return null;
  const path = file.filePath.trim();
  if (/^https?:\/\//i.test(path)) return path;
  return `/api/files/${file.fileId}/content`;
}
