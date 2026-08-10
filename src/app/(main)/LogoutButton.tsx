'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';

/** 테스트용 로그아웃 — `@/lib/api` 배럴 대신 bff 전용 import */
export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLogout() {
    setError(null);
    startTransition(async () => {
      try {
        await bffPostJson(bffEndpoints.auth.logout);
      } catch (err) {
        console.error('[logout]', err);
        setError('로그아웃 요청 실패(쿠키는 BFF에서 지웠을 수 있음)');
      }
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <div>
      <button type="button" onClick={handleLogout} disabled={pending}>
        {pending ? '로그아웃 중…' : '로그아웃'}
      </button>
      {error ? <p>{error}</p> : null}
    </div>
  );
}
