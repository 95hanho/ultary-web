'use client';

import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** /write 직접 진입 시 울타리로 보냄 — 파일 선택은 모달에서 시작 */
export default function WriteIndexPage() {
  const router = useRouter();
  const params = useParams<{ nickname: string }>();
  const nickname = typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];

  useEffect(() => {
    router.replace(myUltaryPath(nickname));
  }, [router, nickname]);

  return null;
}
