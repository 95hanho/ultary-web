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
  /** 있으면 Link, 없으면 onBack 또는 router.back() */
  backHref?: string;
  /** backHref보다 우선. 커스텀 뒤로 동작 */
  onBack?: () => void;
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
  onBack,
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

  const backButton = onBack ? (
    <button type="button" className={styles.headerBtn} aria-label="뒤로" onClick={onBack}>
      <Image src={ArrowLeftIcon} alt="" width={16} height={16} />
    </button>
  ) : backHref ? (
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
  );

  return (
    <header className={styles.header}>
      {backButton}
      <h1 className={styles.title}>{title}</h1>
      {rightSlot}
    </header>
  );
}
