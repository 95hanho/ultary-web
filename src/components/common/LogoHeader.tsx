import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './LogoHeader.module.scss';

const LogoIcon = '/images/img/ultary_logo.png';

type LogoHeaderProps = {
  actions?: ReactNode;
};

/** 로고 + 우측 액션 헤더 (메인 / 마이울타리) */
export function LogoHeader({ actions }: LogoHeaderProps) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoLink} aria-label="메인">
        <Image
          src={LogoIcon}
          alt="ULTARY"
          width={120}
          height={36}
          priority
          className={styles.logo}
        />
      </Link>
      <div className={styles.actions}>{actions}</div>
    </header>
  );
}
