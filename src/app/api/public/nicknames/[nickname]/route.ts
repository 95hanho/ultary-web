import { handleBffError, ok } from '@/lib/api/bffRoute';
import { springEndpoints } from '@/lib/api/endpoints';
import { springGet } from '@/lib/api/springFetch';

type RouteContext = { params: Promise<{ nickname: string }> };

/** BFF /api/public/nicknames/:nickname — GET 공개 닉네임태그 해석(7일 직전 → 현재) */
export async function GET(_request: Request, context: RouteContext) {
  console.log('[API] 닉네임태그 해석');
  try {
    const { nickname: encoded } = await context.params;
    let nickname: string;
    try {
      nickname = decodeURIComponent(encoded);
    } catch {
      nickname = encoded;
    }
    const data = await springGet(
      springEndpoints.public.resolveNickname,
      { nickname },
      undefined,
      { recoverExpiredAccess: false },
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
