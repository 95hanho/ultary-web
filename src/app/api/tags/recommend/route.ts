import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/tags/recommend — GET */
export async function GET() {
  console.log('[API] 태그 추천');
  try {
    // TODO: springFetch 연동
    return notImplemented('tags/recommend GET');
  } catch (err) {
    return handleBffError(err);
  }
}
