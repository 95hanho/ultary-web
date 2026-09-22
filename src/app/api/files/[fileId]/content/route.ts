import { NextResponse } from 'next/server';
import { SPRING_BASE_URL } from '@/lib/env.server';
import { springEndpoints } from '@/lib/api/endpoints';
import {
  handleBffError,
  isUnauthorized,
  requireAccessToken,
} from '@/lib/api/bffRoute';
import { applyPathParams } from '@/lib/api/http';
import { isHttpError } from '@/lib/api/error';

/**
 * BFF /api/files/[fileId]/content — GET
 * Spring 바이너리 프록시. CDN 절대 URL(filePath)에는 FE가 이 API를 호출하지 않음.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  console.log('[API] 파일 content 프록시');
  try {
    const accessToken = await requireAccessToken();
    if (isUnauthorized(accessToken)) return accessToken;
    const { fileId } = await params;
    const [path] = applyPathParams(springEndpoints.files.content, { fileId });
    const res = await fetch(`${SPRING_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

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
          res.headers.get('cache-control') ?? 'private, max-age=3600',
      },
    });
  } catch (err) {
    return handleBffError(err);
  }
}
