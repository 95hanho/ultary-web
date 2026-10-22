import { NextResponse } from 'next/server';
import { prepareSpringRequest } from '@/lib/api/spring-request';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  handleBffError,
  withOptionalAuth,
} from '@/lib/api/bffRoute';
import { applyPathParams } from '@/lib/api/http';
import { isHttpError } from '@/lib/api/error';

/**
 * BFF /api/files/[fileId]/content — GET
 * Spring 바이너리 프록시. CDN 절대 URL(filePath)에는 FE가 이 API를 호출하지 않음.
 */
export const GET = withOptionalAuth<{ fileId: string }>(async ({ accessToken, params }) => {
  console.log('[API] 파일 content 프록시');
  try {
    const { fileId } = params;
    const [path] = applyPathParams(springEndpoints.files.content, { fileId });
    const prepared = prepareSpringRequest(path, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      cache: 'no-store',
    });
    const res = await fetch(prepared.url, prepared.init);

    if (!res.ok) {
      const ct = res.headers.get('content-type') ?? '';
      let data: unknown = null;
      if (ct.includes('application/json')) {
        data = await res.json().catch(() => null);
      }
      const err = {
        message:
          typeof data === 'object' &&
          data &&
          'message' in data &&
          typeof (data as { message: unknown }).message === 'string'
            ? (data as { message: string }).message
            : res.statusText || 'REQUEST_FAILED',
        status: res.status,
        data,
        url: path,
      };
      if (isHttpError(err)) throw err;
      throw err;
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: {
        'Content-Type':
          res.headers.get('content-type') ?? 'application/octet-stream',
        ...(res.headers.get('content-length')
          ? { 'Content-Length': res.headers.get('content-length')! }
          : {}),
        'Cache-Control':
          accessToken ? (res.headers.get('cache-control') ?? 'private, max-age=3600') : 'no-store',
      },
    });
  } catch (err) {
    return handleBffError(err);
  }
});
