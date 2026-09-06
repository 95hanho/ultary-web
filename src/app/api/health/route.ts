import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError, ok } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';

/** BFF /api/health — GET */
export async function GET() {
  console.log('[API] 헬스체크');
  try {
    const data = await springGet(springEndpoints.health.check);
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
