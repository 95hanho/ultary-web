import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/pets — GET/POST */
export async function GET() {
  console.log('[API] 반려동물 목록 조회');
  try {
    // TODO: springFetch 연동
    return notImplemented('pets GET');
  } catch (err) {
    return handleBffError(err);
  }
}

export async function POST() {
  console.log('[API] 반려동물 등록');
  try {
    // TODO: springFetch 연동
    return notImplemented('pets POST');
  } catch (err) {
    return handleBffError(err);
  }
}
