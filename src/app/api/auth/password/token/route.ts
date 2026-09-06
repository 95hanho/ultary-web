import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError, ok, readJsonBody } from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';

/** BFF /api/auth/password/token — POST */
export async function POST(request: NextRequest) {
  console.log('[API] 비밀번호 변경 토큰 생성');
  try {
    const body = await readJsonBody(request);
    const data = await springPostJson(springEndpoints.auth.passwordToken, body);
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}
