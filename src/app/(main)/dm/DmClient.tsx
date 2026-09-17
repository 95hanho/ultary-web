'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import styles from './dm.module.scss';

/** 메시지(DM) — 준비중 */
export default function DmClient() {
  return (
    <div className={styles.shell}>
      <PageHeader title="메시지" />

      <main className={styles.main}>
        <div className={styles.panel}>
          <p className={styles.title}>준비중</p>
          <p className={styles.desc}>메시지 기능은 곧 만나볼 수 있어요.</p>
        </div>
      </main>

      <FooterMenu />
    </div>
  );
}
