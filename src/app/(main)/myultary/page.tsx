'use client';

import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { getCachedMyNickname } from '@/components/common/FooterMenu';
import { MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import type { BffEnvelope, MeResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** /myultary → 최신 me 닉네임태그의 내 울타리로 이동 */
export default function MyUltaryIndexPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const go = (nickname: string) => {
      if (cancelled) return;
      router.replace(myUltaryPath(nickname));
    };
    const cached = getCachedMyNickname()?.trim();
    if (cached) {
      go(cached);
      return;
    }
    void bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me)
      .then((res) => {
        const nickname = res.data?.nickname?.trim();
        go(nickname || MY_NICKNAME);
      })
      .catch((err) => {
        console.error('[myultary] me nickname redirect failed', err);
        go(MY_NICKNAME);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
