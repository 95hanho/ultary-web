'use client';

import Link from 'next/link';
import AdminLogoutButton from './AdminLogoutButton';
import styles from './admin.module.scss';
import { useMenuCounts, withCount } from './useMenuCounts';

export default function AdminMenuClient() {
  const counts = useMenuCounts();

  return (
    <div className={styles.menuScreen}>
      <div className={styles.logoutBar}>
        <AdminLogoutButton />
      </div>
      <div className={styles.menuBody}>
        <h1 className={styles.menuTitle}>관리자 메뉴</h1>
        <Link href="/admin/users" className={styles.menuButton}>회원 관리</Link>
        <Link href="/admin/tags" className={styles.menuButton}>
          {withCount('태그요청', counts?.pendingTagRequestCount)}
        </Link>
        <Link href="/admin/reports" className={styles.menuButton}>
          {withCount('신고목록', counts?.requestedReportCount)}
        </Link>
        <Link href="/admin/ai/logs" className={styles.menuButton}>
          {withCount('AI 오류 로그', counts?.failedAiRequestCount)}
        </Link>
        <Link href="/admin/actions" className={`${styles.menuButton} ${styles.menuHistory}`}>관리자 처리 이력</Link>
      </div>
    </div>
  );
}
