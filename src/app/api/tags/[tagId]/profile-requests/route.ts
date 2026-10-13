import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import type { Params, ParamValue } from '@/lib/api/http';
import {
  bearer,
  handleBffError,
  isUnauthorized,
  ok,
  readJsonBody,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { springPostJson } from '@/lib/api/springFetch';

type Ctx = { params: Promise<{ tagId: string }> };

/** BFF /api/tags/[tagId]/profile-requests — POST */
export async function POST(request: NextRequest, { params }: Ctx) {
  console.log('[API] 태그 설명 요청');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { tagId } = await params;
    const body = await readJsonBody(request);
    const data = await springPostJson(
      springEndpoints.tags.profileRequest,
      { tagId: Number(tagId), ...profileRequestParams(body) },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
}

function profileRequestParams(body: Params): Params {
  const params: Params = {};
  for (const key of ['title', 'content', 'link'] as const) {
    const value = body[key];
    if (typeof value === 'string' && value.trim()) params[key] = value.trim();
  }
  const ids = numberList(body.imageFileIds);
  if (ids.length > 0) params.imageFileIds = ids;
  return params;
}

function numberList(value: ParamValue) {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is number => typeof id === 'number');
}
