import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/error';

/** Spring 연동 전 BFF 스켈레톤 응답 */
export function notImplemented(feature: string) {
  return NextResponse.json(
    {
      success: false,
      code: 'NOT_IMPLEMENTED',
      message: `${feature} is not implemented yet`,
      data: null,
    },
    { status: 501 },
  );
}

export function handleBffError(err: unknown) {
  const { status, payload } = toErrorResponse(err);
  return NextResponse.json(payload, { status });
}
