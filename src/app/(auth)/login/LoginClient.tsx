'use client';

import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import { sanitizeReturnUrl, toLoginRequest } from '@/lib/auth/return-url';
import type { BffEnvelope } from '@/types/api';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import styles from './login.module.scss';

function socialErrorMessage(code?: string) {
  if (!code) return null;
  if (code === 'ACCOUNT_WITHDRAWN') return '탈퇴된 계정입니다.';
  return '소셜 로그인에 실패했습니다. 다시 시도해 주세요.';
}

const LOGO_SRC = '/images/img/ultary_logo_login.png';
const GOOGLE_ICON_SRC = '/images/icon/google_social.png';
const KAKAO_BTN_SRC = '/images/img/kakao_login_large_wide.png';

type Props = {
  initialError?: string;
  returnUrl?: string;
};

function pickLoginError(err: unknown): string {
  if (isHttpError(err) && err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
    if (data.code === 'ACCOUNT_WITHDRAWN') return '탈퇴된 계정입니다.';
    const code = typeof data.message === 'string' ? data.message : '';
    if (code === 'ACCOUNT_WITHDRAWN') return '탈퇴된 계정입니다.';
    if (code === 'LOGIN_FAILED') return '아이디 또는 비밀번호가 올바르지 않습니다.';
    if (code === 'USER_INACTIVE') return '비활성 계정입니다. 고객센터에 문의해 주세요.';
    if (code === 'INVALID_INPUT' && typeof data.detail === 'string') return data.detail;
    if (code) return code;
  }
  if (err instanceof Error && err.message) return err.message;
  return '로그인에 실패했습니다. 다시 시도해 주세요.';
}

export default function LoginClient({ initialError, returnUrl = '' }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loginId, setLoginId] = useState('01011112222');
  const [password, setPassword] = useState('Test1234!');
  const [error, setError] = useState<string | null>(socialErrorMessage(initialError));

  const safeReturn = sanitizeReturnUrl(returnUrl);
  const returnQuery = safeReturn !== '/' ? `?returnUrl=${encodeURIComponent(safeReturn)}` : '';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginId.trim() || !password) {
      setError('휴대폰번호(또는 이메일)와 비밀번호를 입력해 주세요.');
      return;
    }

    startTransition(async () => {
      try {
        await bffPostJson<BffEnvelope<null>>(
          bffEndpoints.auth.login,
          toLoginRequest(loginId, password),
        );
        router.replace(safeReturn);
        router.refresh();
      } catch (err) {
        setError(pickLoginError(err));
      }
    });
  };

  return (
    <main className={styles.shell}>
      <div className={styles.logoWrap}>
        <Image
          src={LOGO_SRC}
          alt="ULTARY"
          width={334}
          height={100}
          priority
          className={styles.logo}
        />
      </div>

      <div className={styles.content}>
        {error ? <p className={styles.errorBanner}>{error}</p> : null}

        <form onSubmit={onSubmit} className={styles.form} noValidate>
          <div className={styles.fields}>
            <input
              type="text"
              name="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="휴대폰번호 또는 이메일을 입력해주세요."
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

          <div className={styles.actions}>
            <button type="submit" className={styles.loginButton} disabled={pending}>
              {pending ? '로그인 중…' : '로그인'}
            </button>

            <Link href="/signup" className={styles.signupLink}>
              계정이 없으신가요?
            </Link>

            <div className={styles.social}>
              <a
                href={`${bffEndpoints.auth.google}${returnQuery}`}
                className={styles.googleBtn}
                aria-disabled={pending}
              >
                <Image
                  src={GOOGLE_ICON_SRC}
                  alt=""
                  width={19}
                  height={19}
                  className={styles.googleIcon}
                />
                구글로그인
              </a>

              <a
                href={`${bffEndpoints.auth.kakao}${returnQuery}`}
                className={styles.kakaoBtn}
                aria-label="카카오 로그인"
                aria-disabled={pending}
              >
                <Image
                  src={KAKAO_BTN_SRC}
                  alt="카카오 로그인"
                  width={600}
                  height={90}
                  className={styles.kakaoImage}
                />
              </a>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
