import { NextResponse } from 'next/server';
import { bearer, handleBffError, isUnauthorized, requireAdminAccessToken } from '@/lib/api/bffRoute';
import { prepareSpringRequest } from '@/lib/api/spring-request';

export async function GET(_request: Request, { params }: { params: Promise<{ aiRequestId: string; fileId: string }> }) {
  try {
    const token = await requireAdminAccessToken();
    if (isUnauthorized(token)) return token;
    const { aiRequestId, fileId } = await params;
    if (!/^\d+$/.test(aiRequestId) || !/^\d+$/.test(fileId)) return new NextResponse(null, { status: 404 });
    const prepared = prepareSpringRequest(`/api/v1/admin/ai/logs/${aiRequestId}/files/${fileId}/content`, {
      headers: bearer(token), cache: 'no-store',
    });
    const response = await fetch(prepared.url, prepared.init);
    if (!response.ok) return new NextResponse(null, { status: response.status });
    return new NextResponse(response.body, { headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    } });
  } catch (error) {
    return handleBffError(error);
  }
}
