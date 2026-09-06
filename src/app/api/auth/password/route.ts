import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError, ok, readJsonBody } from '@/lib/api/bffRoute';
import { springPutJson } from '@/lib/api/springFetch';

/** BFF /api/auth/password — PUT */
export async function PUT(request: NextRequest) {
  console.log('[API] 비밀번호 변경');
  try {
    const body = await readJsonBody(request);
    const data = await springPutJson(springEndpoints.auth.password, body);
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
