'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './PageHeader.module.scss';

const ArrowLeftIcon = '/images/icon/arrow_left.svg';

type PageHeaderProps = {
  title: string;
  /** 있으면 Link, 없으면 router.back() */
  backHref?: string;
  right?: ReactNode;
};

/** 뒤로 + 가운데 제목 헤더 (회원가입 / 게시글 등) */
export function PageHeader({ title, backHref, right }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className={styles.header}>
      {backHref ? (
        <Link href={backHref} className={styles.headerBtn} aria-label="뒤로">
          <Image src={ArrowLeftIcon} alt="" width={16} height={16} />
        </Link>
      ) : (
        <button
          type="button"
          className={styles.headerBtn}
          aria-label="뒤로"
          onClick={() => router.back()}
        >
          <Image src={ArrowLeftIcon} alt="" width={16} height={16} />
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
      {right ?? <span className={styles.headerBtn} aria-hidden />}
    </header>
  );
}
