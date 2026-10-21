import 'server-only';

import { headers } from 'next/headers';
import type { RequestHeaders } from '@/lib/api/http';

/** 로그인 이력에는 BFF fetch의 User-Agent 대신 브라우저 요청 정보를 전달한다. */
export async function clientConnectionHeaders(): Promise<RequestHeaders> {
  const incoming = await headers();
  const result: RequestHeaders = {};
  const agent = incoming.get('user-agent');
  const ip = incoming.get('x-forwarded-for') || incoming.get('x-real-ip');
  if (agent) result['user-agent'] = agent;
  if (ip) result['x-forwarded-for'] = ip;
  return result;
}
