'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { MSG, validatePassword } from '@/lib/auth/signup-rules';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import styles from '../mypage.module.scss';

type FieldErrors = {
  currentPassword?: string;
  password?: string;
  passwordConfirm?: string;
};

function FieldHint({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={styles.fieldError}>* {message}</p>;
}

/** 설정 > 마이페이지 > 비밀번호 변경 */
export default function MyPagePasswordClient() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const currentRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  function clearError(key: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function submitPassword() {
    const next: FieldErrors = {};
    if (!currentPassword) next.currentPassword = '현재 비밀번호를 입력해주세요.';

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

    console.log('[mypage-password] submit', {
      currentPassword,
      password,
      passwordConfirm,
    });
    router.push('/settings/mypage');
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="비밀번호 변경" backHref="/settings/mypage" onSubmit={submitPassword} />

      <div className={styles.form}>
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
