import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springDelete, springPostForm } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ userNo: string }> };

/** BFF /api/users/[userNo]/block — POST */
export async function POST(_request: Request, { params }: Ctx) {
  console.log('[API] 유저 차단');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { userNo } = await params;
    const data = await springPostForm(
      springEndpoints.users.block,
      { userNo },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

/** BFF /api/users/[userNo]/block — DELETE */
export async function DELETE(_request: Request, { params }: Ctx) {
  console.log('[API] 유저 차단 해제');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { userNo } = await params;
    const data = await springDelete(
      springEndpoints.users.block,
      { userNo },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
