'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './PageHeader.module.scss';

const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const SubmitIcon = '/images/icon/Send.svg';

type PageHeaderProps = {
  title: ReactNode;
  titleAlign?: 'center' | 'start';
  /** 기본 모드의 이동 경로. history 모드에서는 이전 방문 기록이 없을 때 사용할 경로 */
  backHref?: string;
  /** history: 방문 기록으로 뒤로 이동하고, 기록이 없으면 backHref(또는 홈)로 대체 */
  backMode?: 'link' | 'history';
  /** 뒤로 버튼을 두지 않는다 */
  hideBack?: boolean;
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
  titleAlign = 'center',
  backHref,
  backMode = 'link',
  hideBack = false,
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

  const backButton = hideBack ? (
    <span className={styles.headerBtn} aria-hidden />
  ) : onBack ? (
    <button type="button" className={styles.headerBtn} aria-label="뒤로" onClick={onBack}>
      <Image src={ArrowLeftIcon} alt="" width={16} height={16} />
    </button>
  ) : backMode === 'history' ? (
    <button
      type="button"
      className={styles.headerBtn}
      aria-label="뒤로"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.replace(backHref ?? '/');
      }}
    >
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
      <h1 className={titleAlign === 'start' ? `${styles.title} ${styles.titleStart}` : styles.title}>{title}</h1>
      {rightSlot}
    </header>
  );
}
