import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import type { BffEnvelope, MeResponse } from '@/types/api';

let request: Promise<number | null> | null = null;

/** 로그인한 내 userNo. 카드·댓글이 같이 써도 요청은 한 번 */
export function loadMyUserNo() {
  if (!request) {
    request = bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me)
      .then((res) => (typeof res.data?.userNo === 'number' ? res.data.userNo : null))
      .catch(() => {
        request = null;
        return null;
      });
  }
  return request;
}
