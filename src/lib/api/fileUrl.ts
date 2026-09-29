import type { FileSummary } from '@/types/file';

/**
 * FileSummary.filePath → 브라우저 표시용 URL.
 * - `http(s)://` (CDN 또는 `/uploads` 절대 URL) → 그대로 사용
 * - 상대경로(`images/…`) → BFF `/api/files/{fileId}/content` 프록시
 * 화면에는 `MediaImage`로 그린다. 업로드 프록시는 로그인 쿠키가 필요하다.
 */
export function resolveFileDisplayUrl(
  file: Pick<FileSummary, 'fileId' | 'filePath'> | null | undefined,
): string | null {
  if (!file?.filePath?.trim()) return null;
  const path = file.filePath.trim();
  if (/^https?:\/\//i.test(path)) return path;
  return `/api/files/${file.fileId}/content`;
}
