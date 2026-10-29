'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { PhoneDemoCode } from '@/components/auth/PhoneDemoCode';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { signupFieldErrors } from '@/lib/auth/signup-errors';
import { isHttpError } from '@/lib/api/error';
import {
  filterCode,
  filterEmail,
  filterName,
  filterPhone,
  MSG,
  validateEmail,
  validateNickname,
  validatePassword,
  validatePhone,
} from '@/lib/auth/signup-rules';
import { getSigunguOptions, isSigunguDisabled, REGION_NONE, SIDO_OPTIONS } from '@/lib/region';
import type { PhoneAuthResponse, PhoneVerifyResponse, SignupRequest } from '@/types/api';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import styles from './signup.module.scss';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function pickErrorMessage(err: unknown, fallback: string) {
  if (isHttpError(err) && err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
    if (typeof data.message === 'string' && data.message.trim()) {
      const code = data.message;
      if (code === 'NICKNAME_DUPLICATED') return '이미 사용 중인 닉네임태그입니다.';
      if (code === 'PHONE_ALREADY_USED') return '이미 가입된 휴대폰 번호입니다.';
      if (code === 'EMAIL_DUPLICATED') return '이미 사용 중인 이메일입니다.';
      return data.message;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

type FieldErrors = {
  phone?: string;
  code?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
  nickname?: string;
  regionSido?: string;
  regionSigungu?: string;
};

const FIELD_ORDER: (keyof FieldErrors)[] = [
  'phone',
  'code',
  'email',
  'password',
  'passwordConfirm',
  'name',
  'nickname',
  'regionSido',
  'regionSigungu',
];

function FieldHint({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={styles.fieldError}>* {message}</p>;
}

/** 검증과 별개로 항상 노출되는 정책 안내 */
function FieldNote({ children }: { children: string }) {
  return <p className={styles.fieldNote}>* {children}</p>;
}

export default function SignupClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [regionSido, setRegionSido] = useState(REGION_NONE);
  const [regionSigungu, setRegionSigungu] = useState(REGION_NONE);

  const [phoneAuthToken, setPhoneAuthToken] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [phoneAuthCompleteToken, setPhoneAuthCompleteToken] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const phoneRevision = useRef(0);

  const codeRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nicknameRef = useRef<HTMLInputElement>(null);
  const regionSidoRef = useRef<HTMLSelectElement>(null);
  const regionSigunguRef = useRef<HTMLSelectElement>(null);

  const sigunguOptions = getSigunguOptions(regionSido);
  const sigunguDisabled = isSigunguDisabled(regionSido);

  function clearError(key: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function resetPhoneAuth() {
    phoneRevision.current += 1;
    setPhoneMessage(null);
    clearError('code');
    setDemoCode('');
    setPhoneAuthToken('');
    setPhoneAuthCompleteToken('');
    setPhoneVerified(false);
    setCode('');
  }

  function requestPhoneCode() {
    setFormError(null);
    setPhoneMessage(null);
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setErrors((prev) => ({ ...prev, phone: phoneErr }));
      return;
    }
    clearError('phone');
    clearError('code');
    const revision = phoneRevision.current;

    startTransition(async () => {
      try {
        const res = await bffPostJson<ApiEnvelope<PhoneAuthResponse>>(bffEndpoints.auth.phone, {
          phone,
        });
        if (revision !== phoneRevision.current) return;
        const token = res.data?.phoneAuthToken;
        if (!token) throw new Error('인증 토큰을 받지 못했습니다.');
        setPhoneAuthToken(token);
        setDemoCode(res.data?.demoCode ?? '');
        setPhoneAuthCompleteToken('');
        setPhoneVerified(false);
        setCode('');
        setPhoneMessage(res.data?.demoCode ? null : '인증번호를 발송했습니다.');
      } catch (err) {
        if (revision !== phoneRevision.current) return;
        setErrors((prev) => ({
          ...prev,
          phone: pickErrorMessage(err, '인증번호 발송에 실패했습니다.'),
        }));
      }
    });
  }

  function verifyPhoneCode() {
    setFormError(null);
    setPhoneMessage(null);
    if (!phoneAuthToken) {
      setErrors((prev) => ({ ...prev, phone: '먼저 인증번호를 요청해주세요.' }));
      return;
    }
    if (!code.trim()) {
      setErrors((prev) => ({ ...prev, code: MSG.code }));
      return;
    }
    clearError('phone');
    clearError('code');
    const revision = phoneRevision.current;

    startTransition(async () => {
      try {
        const res = await bffPostJson<ApiEnvelope<PhoneVerifyResponse>>(
          bffEndpoints.auth.phoneVerify,
          { code, phoneAuthToken },
        );
        if (revision !== phoneRevision.current) return;
        const token = res.data?.phoneAuthCompleteToken;
        if (!token) throw new Error('휴대폰 인증 완료 토큰이 없습니다.');
        setPhoneAuthCompleteToken(token);
        setPhoneVerified(true);
        setDemoCode('');
        setPhoneMessage('휴대폰 인증이 완료되었습니다.');
      } catch (err) {
        if (revision !== phoneRevision.current) return;
        setPhoneVerified(false);
        setPhoneAuthCompleteToken('');
        setErrors((prev) => ({
          ...prev,
          code: pickErrorMessage(err, '인증번호 확인에 실패했습니다.'),
        }));
      }
    });
  }

  function submitSignup() {
    setFormError(null);
    setPhoneMessage(null);

    const next: FieldErrors = {};
    const phoneErr = validatePhone(phone);
    if (phoneErr) next.phone = phoneErr;
    else if (!phoneAuthCompleteToken) next.phone = MSG.phoneAuth;

    const emailErr = validateEmail(email);
    if (emailErr) next.email = emailErr;

    const pwErr = validatePassword(password);
    if (pwErr) next.password = pwErr;
    if (!passwordConfirm) next.passwordConfirm = MSG.passwordRequired;
    else if (password !== passwordConfirm) next.passwordConfirm = MSG.passwordConfirm;

    if (!name.trim()) next.name = MSG.nameRequired;
    if (!nickname.trim()) next.nickname = MSG.nicknameRequired;
    else {
      const nickErr = validateNickname(nickname);
      if (nickErr) next.nickname = nickErr;
    }

    if (regionSido === REGION_NONE) next.regionSido = MSG.sidoRequired;
    if (!sigunguDisabled && regionSigungu === REGION_NONE) {
      next.regionSigungu = MSG.sigunguRequired;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = FIELD_ORDER.find((key) => next[key]);
      const el = first
        ? {
            phone: phoneRef,
            code: codeRef,
            email: emailRef,
            password: passwordRef,
            passwordConfirm: passwordConfirmRef,
            name: nameRef,
            nickname: nicknameRef,
            regionSido: regionSidoRef,
            regionSigungu: regionSigunguRef,
          }[first].current
        : null;
      el?.focus();
      el?.scrollIntoView({ block: 'center' });
      return;
    }

    const body: SignupRequest = {
      phoneAuthCompleteToken,
      password,
      nickname,
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      regionSido: regionSido === REGION_NONE ? undefined : regionSido,
      regionSigungu: sigunguDisabled || regionSigungu === REGION_NONE ? undefined : regionSigungu,
    };

    startTransition(async () => {
      try {
        await bffPostJson(bffEndpoints.auth.signup, body);
        router.replace('/login?signup=complete');
        router.refresh();
      } catch (err) {
        const fieldErrors = signupFieldErrors(err);
        if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
        else setFormError(pickErrorMessage(err, '회원가입에 실패했습니다.'));
      }
    });
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="회원가입" backHref="/login" onSubmit={submitSignup} />

      <div className={styles.form}>
        {formError ? <p className={styles.errorBanner}>{formError}</p> : null}

        <div className={styles.field}>
          <span className={styles.label}>연락처</span>
          <div className={styles.inputWrap}>
            <div className={styles.phoneRow}>
              <input
                ref={phoneRef}
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(filterPhone(e.target.value));
                  resetPhoneAuth();
                  clearError('phone');
                }}
                placeholder="연락처를 입력해주세요.('-' 제외)"
                className={clsx(styles.input, styles.phoneInput)}
              />
              <button
                type="button"
                className={styles.sideBtn}
                onClick={requestPhoneCode}
                disabled={pending || phoneVerified}
              >
                인증요청
              </button>
            </div>
            <PhoneDemoCode code={demoCode} />
            {phoneMessage ? (
              <p className={styles.fieldSuccess} role="status">
                {phoneMessage}
              </p>
            ) : null}
            <FieldHint message={errors.phone} />
          </div>
        </div>

        {phoneAuthToken && !phoneVerified ? (
          <div className={styles.inputWrap}>
            <div className={styles.codeRow}>
              <input
                type="text"
                ref={codeRef}
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setCode(filterCode(e.target.value));
                  clearError('code');
                }}
                placeholder="인증번호 6자리"
                className={clsx(styles.input, styles.phoneInput)}
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
            <FieldHint message={errors.code} />
          </div>
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
          <div className={styles.inputWrap}>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(filterEmail(e.target.value));
                clearError('email');
              }}
              placeholder="이메일을 입력해주세요."
              autoComplete="email"
              className={styles.input}
            />
            <FieldHint message={errors.email} />
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
              ref={passwordConfirmRef}
              type="password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                clearError('passwordConfirm');
              }}
              placeholder="비밀번호를 입력해주세요."
              autoComplete="new-password"
              className={styles.input}
            />
            <FieldHint message={errors.passwordConfirm} />
          </div>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>이름</span>
          <div className={styles.inputWrap}>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(filterName(e.target.value));
                clearError('name');
              }}
              placeholder="이름을 입력해주세요."
              className={styles.input}
            />
            <FieldNote>이름은 한 번 정하면 바꿀 수 없습니다.</FieldNote>
            <FieldHint message={errors.name} />
          </div>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>닉네임태그</span>
          <div className={styles.inputWrap}>
            <div className={styles.nicknameInputWrap}>
              <span className={styles.nicknamePrefix} aria-hidden="true">
                @
              </span>
              <input
                ref={nicknameRef}
                type="text"
                value={nickname}
                autoCapitalize="none"
                autoCorrect="off"
                onChange={(e) => {
                  setNickname(e.target.value);
                  clearError('nickname');
                }}
                placeholder="닉네임태그를 입력해주세요."
                className={clsx(styles.input, styles.nicknameInput)}
              />
            </div>
            <FieldNote>닉네임태그는 30일에 한 번만 변경할 수 있습니다.</FieldNote>
            <FieldHint message={errors.nickname} />
          </div>
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>지역 시/도</span>
            <div className={styles.inputWrap}>
              <select
                ref={regionSidoRef}
                value={regionSido}
                onChange={(e) => {
                  setRegionSido(e.target.value);
                  setRegionSigungu(REGION_NONE);
                  clearError('regionSido');
                  clearError('regionSigungu');
                }}
                className={styles.select}
              >
                {SIDO_OPTIONS.map((sido) => (
                  <option key={sido} value={sido}>
                    {sido}
                  </option>
                ))}
              </select>
              <FieldHint message={errors.regionSido} />
            </div>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>지역 시/군/구</span>
            <div className={styles.inputWrap}>
              <select
                ref={regionSigunguRef}
                value={regionSigungu}
                onChange={(e) => {
                  setRegionSigungu(e.target.value);
                  clearError('regionSigungu');
                }}
                className={styles.select}
                disabled={sigunguDisabled}
              >
                <option value={REGION_NONE}>{REGION_NONE}</option>
                {sigunguOptions.map((sigungu) => (
                  <option key={sigungu} value={sigungu}>
                    {sigungu}
                  </option>
                ))}
              </select>
              <FieldHint message={errors.regionSigungu} />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
