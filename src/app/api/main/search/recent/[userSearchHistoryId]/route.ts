import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ userSearchHistoryId: string }> };

/** 최근 검색 한 건 삭제 */
export async function DELETE(_request: Request, { params }: Ctx) {
  console.log('[API] 최근 검색 한 건 삭제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const { userSearchHistoryId } = await params;
    const data = await springDelete(
      springEndpoints.main.searchRecentItem,
      { userSearchHistoryId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
