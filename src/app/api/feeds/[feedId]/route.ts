import { NextRequest } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  bearer,
  handleBffError,
  ok,
  queryParams,
  readJsonBody,
  withAuth,
  withOptionalAuth,
} from '@/lib/api/bffRoute';
import { springDelete, springGet, springPatchForm } from '@/lib/api/springFetch';

type FeedParams = { feedId: string };

/**
 * 게시글 단건 — 공유 게스트 열람 허용 (share/docs/auth-access.md).
 * 로그인 시 Bearer, 비로그인 시 무토큰으로 Spring 공개 조회.
 */
export const GET = withOptionalAuth<FeedParams>(async ({ request, accessToken, params }) => {
  console.log('[API] 게시글 상세 조회');
  try {
    const { feedId } = params;
    const data = await springGet(
      springEndpoints.feeds.detail,
      { feedId, ...queryParams(request) },
      accessToken ? bearer(accessToken) : undefined,
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
});

export const PATCH = withAuth<FeedParams>(async ({ request, accessToken, params }) => {
  console.log('[API] 게시글 수정');
  try {
    const { feedId } = params;
    const body = await readJsonBody(request);
    const data = await springPatchForm(
      springEndpoints.feeds.detail,
      { feedId, ...body },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
});

export const DELETE = withAuth<FeedParams>(async ({ accessToken, params }) => {
  console.log('[API] 게시글 삭제');
  try {
    const { feedId } = params;
    const data = await springDelete(
      springEndpoints.feeds.detail,
      { feedId },
      bearer(accessToken),
    );
    return ok(data);
  } catch (err) {
    return handleBffError(err);
  }
});
