'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { NotificationInbox } from './NotificationInbox';
import styles from './notifications.module.scss';

/** 알림 페이지 */
export default function NotificationsClient() {
  return (
    <div className={styles.shell}>
      <PageHeader title="알림" />
      <main className={styles.main}>
        <NotificationInbox />
      </main>
      <FooterMenu />
    </div>
  );
}
