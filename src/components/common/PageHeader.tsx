'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './PageHeader.module.scss';

const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const SubmitIcon = '/images/icon/Send.svg';

type PageHeaderProps = {
  title: string;
  /** 있으면 Link, 없으면 router.back() */
  backHref?: string;
  /** 커스텀 우측 영역. 있으면 onSubmit보다 우선 */
  right?: ReactNode;
  /** 있으면 우측 완료(전송) 버튼 생성 */
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
};

/** 뒤로 + 가운데 제목 헤더 (회원가입 / 게시글 / 프로필 사진 등) */
export function PageHeader({
  title,
  backHref,
  right,
  onSubmit,
  submitLabel = '완료',
  submitDisabled = false,
}: PageHeaderProps) {
  const router = useRouter();

  const rightSlot =
    right ??
    (onSubmit ? (
      <button
        type="button"
        className={styles.headerBtn}
        aria-label={submitLabel}
        disabled={submitDisabled}
        onClick={onSubmit}
      >
        <Image src={SubmitIcon} alt="" width={38} height={38} />
      </button>
    ) : (
      <span className={styles.headerBtn} aria-hidden />
    ));

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
      {rightSlot}
    </header>
  );
}
