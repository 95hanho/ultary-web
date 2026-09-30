import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  badRequest,
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  queryParams,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { isRecord } from '@/lib/api/error';
import { springGet, springPostJson, springPostMultipart } from '@/lib/api/springFetch';

/** BFF /api/my-ultary/stories — GET 내 스토리 목록 (FileSummary 임베드) */
export async function GET(request: NextRequest) {
  console.log('[API] 내 스토리 목록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(
      springEndpoints.myUltary.stories,
      queryParams(request),
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/my-ultary/stories — POST 스토리 등록 (JSON: fileId, texts, mentions) */
export async function POST(request: NextRequest) {
  console.log('[API] 스토리 등록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (!isRecord(body)) return badRequest('INVALID_BODY', 'JSON 객체가 필요합니다.');
      const data = await springPostJson(springEndpoints.myUltary.stories, body, bearer(accessToken));
      return ok(data);
    }
    const formData = await request.formData();
    const data = await springPostMultipart(
      springEndpoints.myUltary.stories,
      formData,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
