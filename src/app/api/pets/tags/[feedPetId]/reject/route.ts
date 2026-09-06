import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostForm } from '@/lib/api/springFetch';

/** BFF /api/pets/tags/[feedPetId]/reject — POST */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ feedPetId: string }> },
) {
  console.log('[API] 피드 반려동물 태그 거절');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { feedPetId } = await params;
    const data = await springPostForm(
      springEndpoints.pets.tagReject,
      { feedPetId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
