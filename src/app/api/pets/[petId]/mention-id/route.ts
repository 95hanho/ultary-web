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
import { springPatchJson } from '@/lib/api/springFetch';

/** BFF /api/pets/[petId]/mention-id — PATCH */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ petId: string }> },
) {
  console.log('[API] 반려동물 멘션 변경');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { petId } = await params;
    const body = await readJsonBody(request);
    const data = await springPatchJson(
      springEndpoints.pets.mentionId,
      { petId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
