import { NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  readJsonBody,
  requireAdminAccessToken,
} from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userNo: string; action: string }> },
) {
  try {
    const token = await requireAdminAccessToken();
    if (isUnauthorized(token)) return token;
    const { userNo, action } = await params;
    if (action !== 'suspend' && action !== 'unsuspend')
      return NextResponse.json({ message: '없는 요청입니다.' }, { status: 404 });
    const path =
      action === 'suspend'
        ? springEndpoints.admin.userSuspend
        : springEndpoints.admin.userUnsuspend;
    const body = await readJsonBody(request);
    return ok(
      await springPostJson(
        path.replace(':userNo', encodeURIComponent(userNo)),
        { reason: body.reason },
        bearer(token),
      ),
    );
  } catch (error) {
    return handleBffError(error);
  }
}
