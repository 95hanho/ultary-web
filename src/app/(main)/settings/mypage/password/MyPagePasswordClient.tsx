'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPutJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import { MSG, validatePassword } from '@/lib/auth/signup-rules';
import type { BffEnvelope, ChangeMyPasswordRequest, MeResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import styles from '../mypage.module.scss';

type FieldErrors = {
  currentPassword?: string;
  password?: string;
  passwordConfirm?: string;
};

function pickErrorMessage(err: unknown, fallback: string) {
  if (isHttpError(err) && err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function FieldHint({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={styles.fieldError}>* {message}</p>;
}

/** 설정 > 마이페이지 > 비밀번호 변경. PUT /auth/password/me */
export default function MyPagePasswordClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hasPassword, setHasPassword] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const currentRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me)
      .then((res) => {
        if (!cancelled && res.data) setHasPassword(res.data.hasPassword);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function clearError(key: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function submitPassword() {
    if (pending) return;
    setFormError(null);
    const next: FieldErrors = {};
    if (hasPassword && !currentPassword) {
      next.currentPassword = '현재 비밀번호를 입력해주세요.';
    }

    const pwErr = validatePassword(password);
    if (pwErr) next.password = pwErr;

    if (!passwordConfirm) next.passwordConfirm = MSG.passwordRequired;
    else if (password !== passwordConfirm) next.passwordConfirm = MSG.passwordConfirm;

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = (['currentPassword', 'password', 'passwordConfirm'] as const).find(
        (k) => next[k],
      );
      const el =
        first === 'currentPassword'
          ? currentRef.current
          : first === 'password'
            ? passwordRef.current
            : confirmRef.current;
      el?.focus();
      el?.scrollIntoView({ block: 'center' });
      return;
    }

    const body: ChangeMyPasswordRequest = { newPassword: password };
    if (hasPassword) body.currentPassword = currentPassword;

    startTransition(async () => {
      try {
        await bffPutJson(bffEndpoints.auth.passwordMe, body);
        router.push('/login');
        router.refresh();
      } catch (err) {
        console.error('[mypage-password] submit', err);
        const message = pickErrorMessage(err, '비밀번호 변경에 실패했습니다.');
        const code =
          isHttpError(err) && err.data && typeof err.data === 'object'
            ? (err.data as Record<string, unknown>).code
            : undefined;
        if (code === 'CURRENT_PASSWORD_INVALID' || message.includes('현재 비밀번호')) {
          setErrors({ currentPassword: '현재 비밀번호가 올바르지 않습니다.' });
          currentRef.current?.focus();
          return;
        }
        setFormError(message);
      }
    });
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="비밀번호 변경" backHref="/settings/mypage" onSubmit={submitPassword} />

      <div className={styles.form}>
        {formError ? <p className={styles.errorBanner}>{formError}</p> : null}
        {hasPassword ? (
          <label className={styles.field}>
            <span className={styles.label}>현재 비밀번호</span>
            <div className={styles.inputWrap}>
              <input
                ref={currentRef}
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  clearError('currentPassword');
                }}
                placeholder="비밀번호를 입력해주세요."
                autoComplete="current-password"
                className={styles.input}
              />
              <FieldHint message={errors.currentPassword} />
            </div>
          </label>
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>비밀번호</span>
          <div className={styles.inputWrap}>
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError('password');
              }}
              placeholder="비밀번호를 입력해주세요."
              autoComplete="new-password"
              className={styles.input}
            />
            <FieldHint message={errors.password} />
          </div>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호 확인</span>
          <div className={styles.inputWrap}>
            <input
              ref={confirmRef}
              type="password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                clearError('passwordConfirm');
              }}
              placeholder="비밀번호를 다시 입력해주세요."
              autoComplete="new-password"
              className={styles.input}
            />
            <FieldHint message={errors.passwordConfirm} />
          </div>
        </label>
      </div>
    </div>
  );
}
