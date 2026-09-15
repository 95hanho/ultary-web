'use client';

import { PageHeader } from '@/components/common/PageHeader';
import {
  formatPhoneDisplay,
  formatRegionDisplay,
  MOCK_MY_PROFILE,
} from '@/lib/mock/mypage';
import Link from 'next/link';
import styles from './mypage.module.scss';

/** 설정 > 마이페이지 (조회) */
export default function MyPageClient() {
  const profile = MOCK_MY_PROFILE;

  return (
    <div className={styles.shell}>
      <PageHeader title="마이페이지" backHref="/settings" />

      <div className={styles.main}>
        <div className={styles.rows}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>비밀번호</span>
            <Link href="/settings/mypage/password" className={styles.passwordChangeBtn}>
              비밀번호 변경
            </Link>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>이름</span>
            <span className={styles.rowValue}>{profile.name}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>닉네임</span>
            <span className={styles.rowValue}>{profile.nickname}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>이메일</span>
            <span className={styles.rowValue}>{profile.email}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>연락처</span>
            <span className={styles.rowValue}>{formatPhoneDisplay(profile.phone)}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>지역</span>
            <span className={styles.rowValue}>
              {formatRegionDisplay(profile.regionSido, profile.regionSigungu)}
            </span>
          </div>
        </div>

        <Link href="/settings/mypage/edit" className={styles.primaryBtn}>
          회원정보 수정
        </Link>
      </div>
    </div>
  );
}
