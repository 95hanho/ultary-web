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
import { springPostJson } from '@/lib/api/springFetch';

/** 첫 메시지가 있을 때만 방을 생성한다. */
export async function POST(request: NextRequest) {
  try {
    const token = await requireAccessToken();
    if (isUnauthorized(token)) return token;
    const data = await springPostJson(
      springEndpoints.dm.start,
      await readJsonBody(request),
      bearer(token),
    );
    return ok(data);
  } catch (error) {
    return handleBffError(error);
  }
}
