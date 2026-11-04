'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import styles from './StoryOpenButton.module.scss';

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  /** 기본 router.push 대신 (검색 최근기록 저장 등) */
  onOpen?: () => void;
  onMouseDown?: ButtonHTMLAttributes<HTMLButtonElement>['onMouseDown'];
  /**
   * true(기본): border/padding/background 리셋.
   * false: 사이드 탭처럼 호스트 className이 크롬을 담당할 때.
   */
  resetChrome?: boolean;
};

function isModifiedOrNonPrimaryClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

/** 스토리 진입 — 같은 탭만. 새 탭·Ctrl/Shift/중간 클릭 무시 */
export function StoryOpenButton({
  href,
  children,
  className,
  'aria-label': ariaLabel,
  onOpen,
  onMouseDown,
  resetChrome = true,
}: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={clsx(styles.root, resetChrome && styles.chromeReset, className)}
      aria-label={ariaLabel}
      onMouseDown={onMouseDown}
      onClick={(event) => {
        if (isModifiedOrNonPrimaryClick(event)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (onOpen) onOpen();
        else router.push(href);
      }}
      onAuxClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {children}
    </button>
  );
}
