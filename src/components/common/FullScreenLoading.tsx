'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import styles from './FullScreenLoading.module.scss';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function FullScreenLoading({ open, label = '게시글을 등록하고 있습니다. 잠시만 기다려 주세요.' }: { open: boolean; label?: string }) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const panelRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open || !mounted) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const panel = panelRef.current;
    document.body.style.overflow = 'hidden';
    // Native modal top layer also blocks controls with very high z-index (e.g. the dev dock).
    panel?.showModal();
    panel?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      panel?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;
  return createPortal(
    <dialog ref={panelRef} className={styles.dim} aria-label={label} tabIndex={-1} onCancel={(event) => event.preventDefault()}>
      <span role="status" className={styles.indicator}>
        <span className={styles.spinner} aria-hidden="true" />
        <span className={styles.srOnly}>{label}</span>
      </span>
    </dialog>,
    document.body,
  );
}
