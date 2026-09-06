import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPatchMultipart } from '@/lib/api/springFetch';

/** BFF /api/my-ultary/profile-image — PATCH */
export async function PATCH(request: NextRequest) {
  console.log('[API] 프로필 사진 변경');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const formData = await request.formData();
    const data = await springPatchMultipart(
      springEndpoints.myUltary.profileImage,
      formData,
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
