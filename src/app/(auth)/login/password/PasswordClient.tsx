'use client';
import { useModalStore } from '@/stores/modal.store';
import { nicknameTag } from '@/lib/nickname-tag';
import { PhoneDemoCode } from '@/components/auth/PhoneDemoCode';

import { PageHeader } from '@/components/common/PageHeader';
import { bffPostJson, bffPutJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import {
  filterCode,
  filterPhone,
  MSG,
  validatePassword,
  validatePhone,
} from '@/lib/auth/signup-rules';
import type {
  BffEnvelope,
  PasswordTokenResponse,
  PhoneAuthResponse,
  PhoneVerifyResponse,
} from '@/types/api';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import styles from '../../signup/signup.module.scss';

type FieldErrors = {
  phone?: string;
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

export default function PasswordClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneAuthToken, setPhoneAuthToken] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [phoneAuthCompleteToken, setPhoneAuthCompleteToken] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);

  function clearError(key: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function requestPhoneCode() {
    setFormError(null);
    setInfoMessage(null);
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setErrors((prev) => ({ ...prev, phone: phoneErr }));
      phoneRef.current?.focus();
      return;
    }
    clearError('phone');

    startTransition(async () => {
      try {
        const res = await bffPostJson<BffEnvelope<PhoneAuthResponse>>(bffEndpoints.auth.phone, {
          phone,
          purpose: 'PASSWORD',
        });
        const token = res.data?.phoneAuthToken;
        if (!token) throw new Error('인증 토큰을 받지 못했습니다.');
        setPhoneAuthToken(token);
        setDemoCode(res.data?.demoCode ?? '');
        setPhoneAuthCompleteToken('');
        setPhoneVerified(false);
        setInfoMessage(
          res.data?.demoCode ? '데모 인증번호를 확인해 주세요.' : '인증번호를 발송했습니다.',
        );
      } catch (err) {
        setFormError(pickErrorMessage(err, '인증번호 발송에 실패했습니다.'));
      }
    });
  }

  function verifyPhoneCode() {
    setFormError(null);
    setInfoMessage(null);
    if (!phoneAuthToken) {
      setErrors((prev) => ({ ...prev, phone: '먼저 인증번호를 요청해주세요.' }));
      return;
    }
    if (!code.trim()) {
      setErrors((prev) => ({ ...prev, phone: MSG.code }));
      return;
    }
    clearError('phone');

    startTransition(async () => {
      try {
        const res = await bffPostJson<BffEnvelope<PhoneVerifyResponse>>(
          bffEndpoints.auth.phoneVerify,
          { code, phoneAuthToken },
        );
        const token = res.data?.phoneAuthCompleteToken;
        if (!token) throw new Error('휴대폰 인증 완료 토큰이 없습니다.');
        setPhoneAuthCompleteToken(token);
        setPhoneVerified(true);
        setInfoMessage('휴대폰 인증이 완료되었습니다.');
      } catch (err) {
        setPhoneVerified(false);
        setPhoneAuthCompleteToken('');
        setFormError(pickErrorMessage(err, '인증번호 확인에 실패했습니다.'));
      }
    });
  }

  function submitPassword(userNo?: number) {
    setFormError(null);
    setInfoMessage(null);
    const next: FieldErrors = {};
    const phoneErr = validatePhone(phone);
    if (phoneErr) next.phone = phoneErr;
    else if (!phoneAuthCompleteToken) next.phone = MSG.phoneAuth;

    const pwErr = validatePassword(password);
    if (pwErr) next.password = pwErr;
    if (!passwordConfirm) next.passwordConfirm = MSG.passwordRequired;
    else if (password !== passwordConfirm) next.passwordConfirm = MSG.passwordConfirm;

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const el = next.phone
        ? phoneRef.current
        : next.password
          ? passwordRef.current
          : passwordConfirmRef.current;
      el?.focus();
      return;
    }

    startTransition(async () => {
      try {
        const tokenRes = await bffPostJson<BffEnvelope<PasswordTokenResponse>>(
          bffEndpoints.auth.passwordToken,
          { phone, phoneAuthCompleteToken, userNo },
        );
        if (tokenRes.data?.selectionRequired) {
          useModalStore
            .getState()
            .open({
              variant: 'action',
              title: '비밀번호를 변경할 계정을 선택해 주세요.',
              showCloseButton: true,
              items: (tokenRes.data.accounts ?? []).map((account) => ({
                label: nicknameTag(account.nickname),
                onClick: () => submitPassword(account.userNo),
              })),
            });
          return;
        }
        const passwordChangeToken = tokenRes.data?.passwordChangeToken;
        if (!passwordChangeToken) throw new Error('비밀번호 변경 토큰이 없습니다.');
        await bffPutJson(bffEndpoints.auth.password, {
          passwordChangeToken,
          newPassword: password,
        });
        router.replace('/login');
      } catch (err) {
        setFormError(pickErrorMessage(err, '비밀번호 변경에 실패했습니다.'));
      }
    });
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="비밀번호 찾기" backHref="/login" onSubmit={submitPassword} />

      <div className={styles.form}>
        {formError ? <p className={styles.errorBanner}>{formError}</p> : null}
        {infoMessage ? <p className={styles.infoBanner}>{infoMessage}</p> : null}

        <div className={styles.field}>
          <span className={styles.label}>연락처</span>
          <div className={styles.inputWrap}>
            <div className={styles.phoneRow}>
              <input
                ref={phoneRef}
                value={phone}
                onChange={(e) => {
                  setPhone(filterPhone(e.target.value));
                  clearError('phone');
                  setPhoneAuthToken('');
                  setDemoCode('');
                  setPhoneAuthCompleteToken('');
                  setPhoneVerified(false);
                }}
                placeholder="연락처를 입력해주세요.('-' 제외)"
                inputMode="numeric"
                autoComplete="tel"
                className={`${styles.input} ${styles.phoneInput}`}
                disabled={pending}
              />
              <button
                type="button"
                className={styles.sideBtn}
                onClick={requestPhoneCode}
                disabled={pending}
              >
                인증요청
              </button>
            </div>
            <PhoneDemoCode code={demoCode} />
            {phoneAuthToken && !phoneVerified ? (
              <div className={styles.codeRow}>
                <input
                  value={code}
                  onChange={(e) => setCode(filterCode(e.target.value))}
                  placeholder="인증번호 6자리"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`${styles.input} ${styles.phoneInput}`}
                  disabled={pending}
                />
                <button
                  type="button"
                  className={styles.sideBtn}
                  onClick={verifyPhoneCode}
                  disabled={pending}
                >
                  확인
                </button>
              </div>
            ) : null}
            <FieldHint message={errors.phone} />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>새 비밀번호</span>
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
              disabled={pending}
            />
            <FieldHint message={errors.password} />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>새 비밀번호 확인</span>
          <div className={styles.inputWrap}>
            <input
              ref={passwordConfirmRef}
              type="password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                clearError('passwordConfirm');
              }}
              placeholder="비밀번호를 다시 입력해주세요."
              autoComplete="new-password"
              className={styles.input}
              disabled={pending}
            />
            <FieldHint message={errors.passwordConfirm} />
          </div>
        </div>
      </div>
    </div>
  );
}
