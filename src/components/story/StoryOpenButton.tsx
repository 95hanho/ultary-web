'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import {
  useRef,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
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

function hasOpenModifier(
  event: Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'button'>,
) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

/** 스토리 진입 — 같은 탭만. Ctrl/Shift/Meta/Alt·중간 클릭은 무시 */
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
  const ignoreClickRef = useRef(false);

  const blockModified = (event: MouseEvent | PointerEvent) => {
    if (!hasOpenModifier(event)) return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };

  return (
    <button
      type="button"
      className={clsx(styles.root, resetChrome && styles.chromeReset, className)}
      aria-label={ariaLabel}
      onPointerDown={(event) => {
        // Ctrl/Shift 등은 click까지 오기 전에 막아 router.push가 호출되지 않게 한다.
        ignoreClickRef.current = hasOpenModifier(event);
        if (ignoreClickRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onMouseDown={(event) => {
        if (blockModified(event)) {
          ignoreClickRef.current = true;
          return;
        }
        onMouseDown?.(event);
      }}
      onClick={(event) => {
        if (ignoreClickRef.current || hasOpenModifier(event)) {
          ignoreClickRef.current = false;
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
