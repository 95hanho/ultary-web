'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import {
  formatPhoneDisplay,
  formatRegionDisplay,
  MOCK_MY_PROFILE,
} from '@/lib/mock/mypage';
import type { BffEnvelope, MeResponse } from '@/types/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './mypage.module.scss';

type ProfileView = {
  name: string;
  nickname: string;
  email: string;
  phone: string;
  regionSido: string;
  regionSigungu: string;
};

function meToView(me: MeResponse): ProfileView {
  return {
    name: me.name?.trim() || '-',
    nickname: me.nickname,
    email: me.email?.trim() || '-',
    phone: me.phone?.replace(/\D/g, '') || '',
    regionSido: me.regionSido?.trim() || '선택 없음',
    regionSigungu: me.regionSigungu?.trim() || '선택 없음',
  };
}

/** 설정 > 마이페이지 (조회) */
export default function MyPageClient() {
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (!cancelled) {
          setProfile({
            name: MOCK_MY_PROFILE.name,
            nickname: MOCK_MY_PROFILE.nickname,
            email: MOCK_MY_PROFILE.email,
            phone: MOCK_MY_PROFILE.phone,
            regionSido: MOCK_MY_PROFILE.regionSido,
            regionSigungu: MOCK_MY_PROFILE.regionSigungu,
          });
          const detail =
            isHttpError(err) && err.data && typeof err.data === 'object'
              ? String(
                  (err.data as { detail?: string; message?: string }).detail ??
                    (err.data as { message?: string }).message ??
                    '',
                )
              : '';
          setError(
            detail.trim() ||
              '회원정보를 불러오지 못해 임시 데이터를 표시합니다.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const view = profile;

  return (
    <div className={styles.shell}>
      <PageHeader title="마이페이지" backHref="/settings" />

      <div className={styles.main}>
        {error ? <p className={styles.errorBanner}>{error}</p> : null}
        {loading || !view ? (
          <p className={styles.fieldNote}>불러오는 중…</p>
        ) : (
          <>
            <div className={styles.rows}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>비밀번호</span>
                <Link
                  href="/settings/mypage/password"
                  className={styles.passwordChangeBtn}
                >
                  비밀번호 변경
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
            </div>

            <Link href="/settings/mypage/edit" className={styles.primaryBtn}>
              회원정보 수정
            </Link>
          </>
        )}
      </div>

      <FooterMenu />
    </div>
  );
}
