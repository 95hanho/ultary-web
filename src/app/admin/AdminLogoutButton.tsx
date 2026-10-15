'use client';

import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from './admin.module.scss';

export default function AdminLogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onLogout = () => {
    setError(null);
    startTransition(async () => {
      try {
        await bffPostJson(bffEndpoints.admin.logout);
      } catch (err) {
        console.error('[admin logout]', err);
        setError('로그아웃 요청에 실패했습니다.');
      }
      router.replace('/admin');
      router.refresh();
    });
  };

  return (
    <div className={styles.logoutSlot}>
      <button type="button" className={styles.logoutButton} onClick={onLogout} disabled={pending}>
        {pending ? '로그아웃 중…' : '로그아웃'}
      </button>
      {error ? <p className={styles.logoutError}>{error}</p> : null}
    </div>
  );
}
