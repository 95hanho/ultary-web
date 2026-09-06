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
import { springDelete, springPatchForm } from '@/lib/api/springFetch';

/** BFF /api/pets/[petId] — PATCH */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ petId: string }> },
) {
  console.log('[API] 반려동물 수정');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { petId } = await params;
    const body = await readJsonBody(request);
    const data = await springPatchForm(
      springEndpoints.pets.detail,
      { petId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/pets/[petId] — DELETE */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ petId: string }> },
) {
  console.log('[API] 반려동물 삭제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { petId } = await params;
    const data = await springDelete(
      springEndpoints.pets.detail,
      { petId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
