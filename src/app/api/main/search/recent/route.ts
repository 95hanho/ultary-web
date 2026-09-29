import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete, springGet, springPostJson } from '@/lib/api/springFetch';

/** 최근 검색 5건 */
export async function GET() {
  console.log('[API] 최근 검색');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springGet(
      springEndpoints.main.searchRecent,
      undefined,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** 검색 후 울타리 진입 기록 */
export async function POST(request: NextRequest) {
  console.log('[API] 최근 검색 저장');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const body = await readJsonBody(request);
    const data = await springPostJson(
      springEndpoints.main.searchRecent,
      { targetUserNo: body.targetUserNo },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** 최근 검색 모두 지우기 */
export async function DELETE() {
  console.log('[API] 최근 검색 모두 지우기');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;

    const data = await springDelete(
      springEndpoints.main.searchRecent,
      undefined,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
