'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPatchJson, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import {
  filterCode,
  filterEmail,
  filterNickname,
  filterPhone,
  MSG,
  validateEmail,
  validateNickname,
  validatePhone,
} from '@/lib/auth/signup-rules';
import { MOCK_MY_PROFILE } from '@/lib/mock/mypage';
import { getSigunguOptions, isSigunguDisabled, REGION_NONE, SIDO_OPTIONS } from '@/lib/region';
import type {
  BffEnvelope,
  MeResponse,
  PhoneAuthResponse,
  PhoneVerifyResponse,
  UpdateMeRequest,
} from '@/types/api';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import styles from '../mypage.module.scss';

const DEV_SKIP_PHONE_AUTH = process.env.NODE_ENV === 'development' && true;
const DEV_PHONE_AUTH_TOKEN = 'dev-phone-auth-token';
const DEV_PHONE_AUTH_COMPLETE_TOKEN = 'dev-phone-auth-complete-token';

type ApiEnvelope<T> = BffEnvelope<T>;

type FieldErrors = {
  nickname?: string;
  email?: string;
  phone?: string;
  regionSido?: string;
  regionSigungu?: string;
};

const FIELD_ORDER: (keyof FieldErrors)[] = [
  'nickname',
  'email',
  'phone',
  'regionSido',
  'regionSigungu',
];

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

function FieldNote({ children }: { children: string }) {
  return <p className={styles.fieldNote}>* {children}</p>;
}

/** 설정 > 마이페이지 > 회원정보 수정 */
export default function MyPageEditClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  const [nickname, setNickname] = useState(MOCK_MY_PROFILE.nickname);
  const [email, setEmail] = useState(MOCK_MY_PROFILE.email);
  const [phone, setPhone] = useState(MOCK_MY_PROFILE.phone);
  const [code, setCode] = useState('');
  const [regionSido, setRegionSido] = useState(MOCK_MY_PROFILE.regionSido);
  const [regionSigungu, setRegionSigungu] = useState(MOCK_MY_PROFILE.regionSigungu);
  const [initialPhone, setInitialPhone] = useState(MOCK_MY_PROFILE.phone);

  const [phoneAuthToken, setPhoneAuthToken] = useState('');
  const [phoneAuthCompleteToken, setPhoneAuthCompleteToken] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const nicknameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const regionSidoRef = useRef<HTMLSelectElement>(null);
  const regionSigunguRef = useRef<HTMLSelectElement>(null);

  const sigunguOptions = getSigunguOptions(regionSido);
  const sigunguDisabled = isSigunguDisabled(regionSido);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
        const me = res.data;
        if (!me || cancelled) return;
        setNickname(me.nickname);
        setEmail(me.email ?? '');
        const phoneDigits = me.phone?.replace(/\D/g, '') ?? '';
        setPhone(phoneDigits);
        setInitialPhone(phoneDigits);
        setRegionSido(me.regionSido?.trim() || REGION_NONE);
        setRegionSigungu(me.regionSigungu?.trim() || REGION_NONE);
        setPhoneVerified(true);
        setPhoneAuthCompleteToken(DEV_PHONE_AUTH_COMPLETE_TOKEN);
      } catch (err) {
        console.error('[mypage-edit] load', err);
        if (!cancelled) {
          setFormError('회원정보를 불러오지 못했습니다. 임시 값으로 편집합니다.');
          setPhoneVerified(true);
          setPhoneAuthCompleteToken(DEV_PHONE_AUTH_COMPLETE_TOKEN);
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
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
        setInfoMessage('인증번호를 발송했습니다.');
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

  function submitEdit() {
    setFormError(null);
    setInfoMessage(null);

    const next: FieldErrors = {};
    if (!nickname.trim()) next.nickname = MSG.nicknameRequired;
    else {
      const nickErr = validateNickname(nickname);
      if (nickErr) next.nickname = nickErr;
    }

    const emailErr = validateEmail(email);
    if (emailErr) next.email = emailErr;

    const phoneErr = validatePhone(phone);
    if (phoneErr) next.phone = phoneErr;
    else if (phone !== initialPhone && !phoneAuthCompleteToken) next.phone = MSG.phoneAuth;

    if (regionSido === REGION_NONE) next.regionSido = MSG.sidoRequired;
    if (!sigunguDisabled && regionSigungu === REGION_NONE) {
      next.regionSigungu = MSG.sigunguRequired;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = FIELD_ORDER.find((key) => next[key]);
      const el = first
        ? {
            nickname: nicknameRef,
            email: emailRef,
            phone: phoneRef,
            regionSido: regionSidoRef,
            regionSigungu: regionSigunguRef,
          }[first].current
        : null;
      el?.focus();
      el?.scrollIntoView({ block: 'center' });
      return;
    }

    const body: UpdateMeRequest = {
      nickname: nickname.trim(),
      regionSido: regionSido === REGION_NONE ? null : regionSido,
      regionSigungu:
        sigunguDisabled || regionSigungu === REGION_NONE ? null : regionSigungu,
    };

    startTransition(async () => {
      setFormError(null);
      try {
        await bffPatchJson(bffEndpoints.auth.updateMe, body);
        router.push('/settings/mypage');
        router.refresh();
      } catch (err) {
        console.error('[mypage-edit] submit', err);
        setFormError(pickErrorMessage(err, '회원정보 저장에 실패했습니다.'));
      }
    });
  }

  return (
    <div className={styles.shell}>
      <PageHeader
        title="회원 정보 수정"
        backHref="/settings/mypage"
        onSubmit={submitEdit}
        submitDisabled={pending || !loaded}
      />

      <div className={styles.form}>
        {formError ? <p className={styles.errorBanner}>{formError}</p> : null}
        {infoMessage ? <p className={styles.infoBanner}>{infoMessage}</p> : null}

        <label className={styles.field}>
          <span className={styles.label}>닉네임</span>
          <div className={styles.inputWrap}>
            <input
              ref={nicknameRef}
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(filterNickname(e.target.value));
                clearError('nickname');
              }}
              placeholder="닉네임을 입력해주세요."
              className={styles.input}
            />
            <FieldNote>닉네임은 3개월에 한 번만 변경할 수 있습니다.</FieldNote>
            <FieldHint message={errors.nickname} />
          </div>
        </label>

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
            <FieldHint message={errors.phone} />
          </div>
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

        <div className={styles.regionRow}>
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
