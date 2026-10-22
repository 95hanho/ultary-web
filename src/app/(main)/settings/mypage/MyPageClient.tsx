'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import { formatPhoneDisplay, formatRegionDisplay } from '@/lib/mock/mypage';
import type { BffEnvelope, MeResponse } from '@/types/api';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './mypage.module.scss';

const GOOGLE_ICON_SRC = '/images/icon/google_social.png';
const MYPAGE_PATH = '/settings/mypage';

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={40}
      height={40}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 3C6.477 3 2 6.686 2 11.25c0 2.91 1.9 5.47 4.76 6.95-.16.58-.58 2.1-.67 2.43-.1.4.15.39.31.28.13-.09 2.1-1.43 2.95-2.01.85.16 1.74.25 2.65.25 5.523 0 10-3.686 10-8.25S17.523 3 12 3Z"
      />
      <circle cx="8.2" cy="11.25" r="1.2" fill="#fff" />
      <circle cx="12" cy="11.25" r="1.2" fill="#fff" />
      <circle cx="15.8" cy="11.25" r="1.2" fill="#fff" />
    </svg>
  );
}

type ProfileView = {
  name: string;
  nickname: string;
  email: string;
  phone: string;
  regionSido: string;
  regionSigungu: string;
  hasPassword: boolean;
  googleLinked: boolean;
  kakaoLinked: boolean;
};

function meToView(me: MeResponse): ProfileView {
  return {
    name: me.name?.trim() || '-',
    nickname: me.nickname,
    email: me.email?.trim() || '-',
    phone: me.phone?.replace(/\D/g, '') || '',
    regionSido: me.regionSido?.trim() || '선택 없음',
    regionSigungu: me.regionSigungu?.trim() || '선택 없음',
    hasPassword: me.hasPassword === true,
    googleLinked: me.googleLinked === true,
    kakaoLinked: me.kakaoLinked === true,
  };
}

function snsLinkHref(provider: 'google' | 'kakao') {
  const path = provider === 'google' ? bffEndpoints.auth.google : bffEndpoints.auth.kakao;
  const params = new URLSearchParams({
    intent: 'link',
    returnUrl: MYPAGE_PATH,
  });
  return `${path}?${params.toString()}`;
}

function snsLinkErrorMessage(code: string) {
  switch (code) {
    case 'SOCIAL_ALREADY_LINKED':
      return '이미 연동된 소셜 계정입니다.';
    case 'SOCIAL_ACCOUNT_IN_USE':
      return '다른 계정에 이미 연동된 소셜 계정입니다. SNS계정을 회원탈퇴 후 진행해주세요.';
    default:
      return '알 수 없는 오류가 발생했습니다. 관리자에게 문의하세요.';
  }
}

/** 설정 > 마이페이지 (조회) */
export default function MyPageClient() {
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snsError, setSnsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const res = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
    if (!res.data) throw new Error('회원정보를 불러오지 못했습니다.');
    setProfile(meToView(res.data));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
        if (!res.data) throw new Error('회원정보를 불러오지 못했습니다.');
        if (!cancelled) setProfile(meToView(res.data));
      } catch (err) {
        console.error('[mypage]', err);
        if (!cancelled) setLoadFailed({ error: err });
        if (!cancelled) {
          const detail =
            isHttpError(err) && err.data && typeof err.data === 'object'
              ? String(
                  (err.data as { detail?: string; message?: string }).detail ??
                    (err.data as { message?: string }).message ??
                    '',
                )
              : '';
          setError(detail.trim() || '회원정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const linked = searchParams.get('linked');
    const linkError = searchParams.get('error');
    if (!linked && !linkError) return;

    let cancelled = false;

    (async () => {
      if (linkError === 'UNAUTHORIZED') {
        try {
          await bffPostJson(bffEndpoints.auth.logout, {});
        } catch (err) {
          console.error('[mypage] logout after UNAUTHORIZED', err);
        }
        router.replace('/login');
        router.refresh();
        return;
      }

      if (linked) {
        try {
          await loadMe();
        } catch (err) {
          console.error('[mypage] reload after link', err);
        }
      }

      if (linkError && !cancelled) {
        setSnsError(snsLinkErrorMessage(linkError));
      }

      if (!cancelled) router.replace(MYPAGE_PATH);
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  const view = profile;

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

  return (
    <div className={styles.shell}>
      <PageHeader backMode="history" title="마이페이지" backHref="/settings" />

      <div className={styles.main}>
        {error ? <p className={styles.errorBanner}>{error}</p> : null}
        {loading ? (
          <p className={styles.fieldNote}>불러오는 중…</p>
        ) : view ? (
          <>
            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>비밀번호</span>
                <Link
                  href="/settings/mypage/password"
                  className={
                    view.hasPassword
                      ? styles.passwordChangeBtn
                      : styles.passwordSetBtn
                  }
                >
                  {view.hasPassword ? '비밀번호 변경' : '비밀번호 설정'}
                </Link>
              </div>

              <div className={styles.row}>
                <span className={styles.rowLabel}>이름</span>
                <span className={styles.rowValue}>{view.name}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.rowLabel}>닉네임</span>
                <span className={styles.rowValue}>{view.nickname}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.rowLabel}>이메일</span>
                <span className={styles.rowValue}>{view.email}</span>
              </div>

              <div className={styles.row}>
                <span className={styles.rowLabel}>연락처</span>
                <span className={styles.rowValue}>
                  {view.phone ? formatPhoneDisplay(view.phone) : '-'}
                </span>
              </div>

              <div className={styles.row}>
                <span className={styles.rowLabel}>지역</span>
                <span className={styles.rowValue}>
                  {formatRegionDisplay(view.regionSido, view.regionSigungu)}
                </span>
              </div>

              <div className={styles.row}>
                <span className={styles.rowLabel}>SNS 로그인</span>
                <div className={styles.snsBtns}>
                  {view.googleLinked ? (
                    <span
                      className={clsx(styles.snsBtn, styles.snsBtnOn)}
                      aria-label="구글 연동됨"
                    >
                      <Image
                        src={GOOGLE_ICON_SRC}
                        alt=""
                        width={40}
                        height={40}
                        className={styles.snsIcon}
                      />
                    </span>
                  ) : (
                    <a
                      href={snsLinkHref('google')}
                      className={clsx(styles.snsBtn, styles.snsBtnOff)}
                      aria-label="구글 연동하기"
                    >
                      <Image
                        src={GOOGLE_ICON_SRC}
                        alt=""
                        width={40}
                        height={40}
                        className={styles.snsIcon}
                      />
                    </a>
                  )}
                  {view.kakaoLinked ? (
                    <span
                      className={clsx(styles.snsBtn, styles.snsBtnKakao, styles.snsBtnOn)}
                      aria-label="카카오 연동됨"
                    >
                      <KakaoIcon className={clsx(styles.snsIcon, styles.snsIconKakao)} />
                    </span>
                  ) : (
                    <a
                      href={snsLinkHref('kakao')}
                      className={clsx(styles.snsBtn, styles.snsBtnKakao, styles.snsBtnOff)}
                      aria-label="카카오 연동하기"
                    >
                      <KakaoIcon className={clsx(styles.snsIcon, styles.snsIconKakao)} />
                    </a>
                  )}
                </div>
              </div>
              {snsError ? <p className={styles.snsErrorNote}>{snsError}</p> : null}
            </div>

            <Link href="/settings/mypage/edit" className={styles.primaryBtn}>
              회원정보 수정
            </Link>
          </>
        ) : null}
      </div>

      <FooterMenu />
    </div>
  );
}
