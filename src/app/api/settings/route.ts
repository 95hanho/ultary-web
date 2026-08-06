import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/settings — GET/PATCH */
export async function GET() {
  console.log('[API] 설정 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('settings GET');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function PATCH() {
  console.log('[API] 설정 변경');
  try {
    // TODO: springFetch 연동
    return notImplemented('settings PATCH');
  } catch (err) {
    return handleBffError(err);
  }
}
