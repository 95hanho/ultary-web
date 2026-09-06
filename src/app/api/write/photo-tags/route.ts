import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostMultipart } from '@/lib/api/springFetch';

/** BFF write/photo-tags/route.ts — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 사진 태그 저장');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const formData = await request.formData();
    const data = await springPostMultipart(
      springEndpoints.write.photoTags,
      formData,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
