'use client';

import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import type { AdminLoginRequest, BffEnvelope } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import styles from './admin.module.scss';

function pickLoginError(err: unknown): string {
  if (isHttpError(err) && err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
    const code = typeof data.code === 'string' ? data.code : '';
    const message = typeof data.message === 'string' ? data.message : '';
    const key = code || message;
    if (key === 'ADMIN_LOGIN_FAILED') return '아이디 또는 비밀번호가 올바르지 않습니다.';
    if (key === 'ACCOUNT_SUSPENDED') return '정지된 계정입니다.';
    if (key === 'INVALID_INPUT' && typeof data.detail === 'string') return data.detail;
    if (message && message !== key) return message;
    if (key) return key;
  }
  if (err instanceof Error && err.message) return err.message;
  return '로그인에 실패했습니다. 다시 시도해 주세요.';
}

export default function AdminLoginClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginId.trim() || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    startTransition(async () => {
      try {
        await bffPostJson<BffEnvelope<null>, AdminLoginRequest>(
          bffEndpoints.admin.login,
          { loginId: loginId.trim(), password },
        );
        router.replace('/admin');
        router.refresh();
      } catch (err) {
        setError(pickLoginError(err));
      }
    });
  };

  return (
    <main className={styles.shell}>
      <div className={styles.logoWrap}>
        <h1 className={styles.wordmark}>울타리 관리</h1>
      </div>

      <div className={styles.content}>
        {error ? <p className={styles.errorBanner}>{error}</p> : null}

        <form method="post" onSubmit={onSubmit} className={styles.form} noValidate>
          <div className={styles.fields}>
            <input
              type="text"
              name="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디를 입력해주세요."
              autoComplete="username"
              className={styles.input}
              disabled={pending}
            />
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요."
              autoComplete="current-password"
              className={styles.input}
              disabled={pending}
            />
          </div>

          <button type="submit" className={styles.loginButton} disabled={pending}>
            {pending ? '로그인 중…' : '로그인'}
          </button>
        </form>
      </div>
    </main>
  );
}
