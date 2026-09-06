import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  queryParams,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springGet, springPostForm, springPostMultipart } from '@/lib/api/springFetch';

/** BFF /api/pets — GET */
export async function GET(request: NextRequest) {
  console.log('[API] 반려동물 목록 조회');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const data = await springGet(
      springEndpoints.pets.root,
      queryParams(request),
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/pets — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 반려동물 등록');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const data = await springPostMultipart(
        springEndpoints.pets.root,
        formData,
        bearer(accessToken),
      );
      return ok(data);
    }
    const body = await readJsonBody(request);
    const data = await springPostForm(
      springEndpoints.pets.root,
      body,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
