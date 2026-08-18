'use client';

import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
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
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import styles from './signup.module.scss';

const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const SubmitIcon = '/images/icon/Send.svg';

/**
 * 개발 전용: 휴대폰 인증요청/확인 API를 호출하지 않고 무조건 성공.
 * 끄려면 아래 `true`를 `false`로 바꾸거나 해당 줄을 주석 처리.
 */
const DEV_SKIP_PHONE_AUTH = process.env.NODE_ENV === 'development' && true;
// process.env.NODE_ENV === 'development' && false;

const DEV_PHONE_AUTH_TOKEN = 'dev-phone-auth-token';
const DEV_PHONE_AUTH_COMPLETE_TOKEN = 'dev-phone-auth-complete-token';

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
      if (code === 'NICKNAME_DUPLICATED') return '이미 사용 중인 닉네임입니다.';
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
  return <p className="text-sm text-brand-red-400">* {message}</p>;
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
  const [phoneAuthCompleteToken, setPhoneAuthCompleteToken] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

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
    setPhoneAuthToken('');
    setPhoneAuthCompleteToken('');
    setPhoneVerified(false);
    setCode('');
  }

  function requestPhoneCode() {
    setFormError(null);
    setInfoMessage(null);
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setErrors((prev) => ({ ...prev, phone: phoneErr }));
      return;
    }
    clearError('phone');

    if (DEV_SKIP_PHONE_AUTH) {
      setPhoneAuthToken(DEV_PHONE_AUTH_TOKEN);
      setPhoneAuthCompleteToken('');
      setPhoneVerified(false);
      setInfoMessage('개발 모드: 인증번호를 발송한 것으로 처리했습니다.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await bffPostJson<ApiEnvelope<PhoneAuthResponse>>(bffEndpoints.auth.phone, {
          phone,
        });
        const token = res.data?.phoneAuthToken;
        if (!token) throw new Error('인증 토큰을 받지 못했습니다.');
        setPhoneAuthToken(token);
        setPhoneAuthCompleteToken('');
        setPhoneVerified(false);
        setInfoMessage('인증번호를 발송했습니다. (로컬은 서버 로그 확인)');
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
    if (!DEV_SKIP_PHONE_AUTH && !code.trim()) {
      setErrors((prev) => ({ ...prev, phone: MSG.code }));
      return;
    }
    clearError('phone');

    if (DEV_SKIP_PHONE_AUTH) {
      setPhoneAuthCompleteToken(DEV_PHONE_AUTH_COMPLETE_TOKEN);
      setPhoneVerified(true);
      setInfoMessage('개발 모드: 휴대폰 인증을 완료한 것으로 처리했습니다.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await bffPostJson<ApiEnvelope<PhoneVerifyResponse>>(
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

  function submitSignup() {
    setFormError(null);
    setInfoMessage(null);

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
    };

    startTransition(async () => {
      try {
        await bffPostJson(bffEndpoints.auth.signup, body);
        router.replace('/');
        router.refresh();
      } catch (err) {
        setFormError(pickErrorMessage(err, '회원가입에 실패했습니다.'));
      }
    });
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/login" className={styles.headerBtn} aria-label="뒤로">
          <Image src={ArrowLeftIcon} alt="" width={16} height={16} />
        </Link>
        <h1 className={styles.title}>회원가입</h1>
        <button
          type="button"
          className={styles.headerBtn}
          aria-label="회원가입 완료"
          onClick={submitSignup}
        >
          <Image src={SubmitIcon} alt="" width={38} height={38} />
        </button>
      </header>

      <div className={styles.form}>
        {formError ? <p className={styles.errorBanner}>{formError}</p> : null}
        {infoMessage ? <p className={styles.infoBanner}>{infoMessage}</p> : null}

        <div className={styles.field}>
          <span className={styles.label}>연락처</span>
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
          <FieldHint message={errors.phone} />
        </div>

        {phoneAuthToken && !phoneVerified ? (
          <div className={styles.codeRow}>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(filterCode(e.target.value))}
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
        ) : null}

        <label className={styles.field}>
          <span className={styles.label}>이메일</span>
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
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호</span>
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
        </label>

        <label className={styles.field}>
          <span className={styles.label}>비밀번호 확인</span>
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
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>이름</span>
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
            <FieldHint message={errors.name} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>닉네임</span>
            <input
              ref={nicknameRef}
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                clearError('nickname');
              }}
              placeholder="닉네임을 입력해주세요."
              className={styles.input}
            />
            <FieldHint message={errors.nickname} />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>지역 시/도</span>
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
          </label>
          <label className={styles.field}>
            <span className={styles.label}>지역 시/군/구</span>
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
          </label>
        </div>

        <p className={styles.hint}>
          지역은 UI만 반영되어 있으며, 회원가입 API에는 아직 포함하지 않습니다.
        </p>
      </div>
    </div>
  );
}
