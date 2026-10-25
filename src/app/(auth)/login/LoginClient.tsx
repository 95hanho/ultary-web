'use client';

import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import { toLoginRequest } from '@/lib/auth/return-url';
import type { BffEnvelope } from '@/types/api';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import styles from './login.module.scss';

const ACCOUNT_WITHDRAWN_MESSAGE = '탈퇴된 계정입니다. 고객센터에 문의해주세요.';
const ACCOUNT_SUSPENDED_MESSAGE = '정지된 계정입니다. 고객센터에 문의해주세요.';

function accountStatusMessage(code: unknown) {
  if (code === 'ACCOUNT_WITHDRAWN') return ACCOUNT_WITHDRAWN_MESSAGE;
  if (code === 'ACCOUNT_SUSPENDED') return ACCOUNT_SUSPENDED_MESSAGE;
  return null;
}

function socialErrorMessage(code?: string) {
  if (!code) return null;
  return accountStatusMessage(code) ?? '소셜 로그인에 실패했습니다. 다시 시도해 주세요.';
}

const LOGO_SRC = '/images/img/ultary_logo_login.png';
const GOOGLE_ICON_SRC = '/images/icon/google_social.png';
const KAKAO_BTN_SRC = '/images/img/kakao_login_large_wide.png';

type Props = {
  initialError?: string;
  signupComplete?: boolean;
};

function pickLoginError(err: unknown): string {
  if (isHttpError(err) && err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;
    const statusMessage = accountStatusMessage(data.code) ?? accountStatusMessage(data.message);
    if (statusMessage) return statusMessage;
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
    const code = typeof data.message === 'string' ? data.message : '';
    if (code === 'LOGIN_FAILED') return '아이디 또는 비밀번호가 올바르지 않습니다.';
    if (code === 'USER_INACTIVE') return '비활성 계정입니다. 고객센터에 문의해 주세요.';
    if (code === 'INVALID_INPUT' && typeof data.detail === 'string') return data.detail;
    if (code) return code;
  }
  if (err instanceof Error && err.message) return err.message;
  return '로그인에 실패했습니다. 다시 시도해 주세요.';
}

export default function LoginClient({ initialError, signupComplete = false }: Props) {
  const [pending, startTransition] = useTransition();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(socialErrorMessage(initialError));
  const [showSignupComplete, setShowSignupComplete] = useState(signupComplete);

  const clearNotices = () => {
    setError(null);
    setShowSignupComplete(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    clearNotices();

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
        // 계정 전환 시 프로필·사용자 번호·소켓 등 이전 세션의 메모리 캐시도 초기화한다.
        window.location.replace('/');
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
        {showSignupComplete && !error && !pending ? (
          <p className={styles.successBanner} role="status">
            회원가입이 완료되었습니다. 로그인해 주세요.
          </p>
        ) : null}
        {error ? <p className={styles.errorBanner}>{error}</p> : null}

        <form onSubmit={onSubmit} className={styles.form} noValidate>
          <div className={styles.fields}>
            <input
              type="text"
              name="loginId"
              value={loginId}
              onChange={(e) => {
                setLoginId(e.target.value);
                clearNotices();
              }}
              placeholder="휴대폰번호 또는 이메일을 입력해주세요."
              autoComplete="off"
              className={styles.input}
              disabled={pending}
            />
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearNotices();
              }}
              placeholder="비밀번호를 입력해주세요."
              autoComplete="off"
              className={styles.input}
              disabled={pending}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.loginButton} disabled={pending}>
              {pending ? '로그인 중…' : '로그인'}
            </button>

            <Link href="/login/password" className={styles.findPasswordButton}>
              비밀번호 찾기
            </Link>

            <Link href="/signup" className={styles.signupLink}>
              계정이 없으신가요?
            </Link>

            <div className={styles.social}>
              <a
                href={bffEndpoints.auth.google}
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
                href={bffEndpoints.auth.kakao}
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
