'use client';

import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.scss';

/** Zustand 공통 모달 호스트 — Providers에 한 번만 마운트 */
export function ModalHost() {
  const [mounted, setMounted] = useState(false);
  const isOpen = useModalStore((s) => s.isOpen);
  const variant = useModalStore((s) => s.variant);
  const title = useModalStore((s) => s.title);
  const content = useModalStore((s) => s.content);
  const items = useModalStore((s) => s.items);
  const okButton = useModalStore((s) => s.okButton);
  const cancelButton = useModalStore((s) => s.cancelButton);
  const showCloseButton = useModalStore((s) => s.showCloseButton);
  const closeOnDimClick = useModalStore((s) => s.closeOnDimClick);
  const close = useModalStore((s) => s.close);
  const confirmOk = useModalStore((s) => s.confirmOk);
  const confirmCancel = useModalStore((s) => s.confirmCancel);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  if (!mounted || !isOpen) return null;

  const showHeader = Boolean(title) || showCloseButton;
  const showFooter =
    variant !== 'action' && (!okButton.hidden || !cancelButton.hidden);

  return createPortal(
    <div
      className={styles.dim}
      role="presentation"
      onClick={() => {
        if (closeOnDimClick) close();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title || '모달'}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader ? (
          <div className={styles.header}>
            {title ? <h2 className={styles.title}>{title}</h2> : <span />}
            {showCloseButton ? (
              <button
                type="button"
                className={styles.closeBtn}
                aria-label="닫기"
                onClick={close}
              >
                <X size={24} strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        ) : null}

        {variant === 'action' ? (
          <ul className={styles.actionList}>
            {items.map((item) => (
              <li key={item.label} className={styles.actionItem}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => {
                    item.onClick?.();
                    close();
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            {content ? <div className={styles.content}>{content}</div> : null}
            {showFooter ? (
              <div className={styles.footer}>
                {!cancelButton.hidden ? (
                  <button
                    type="button"
                    className={clsx(
                      styles.footerBtn,
                      toneClass(cancelButton.tone),
                    )}
                    onClick={confirmCancel}
                  >
                    {cancelButton.label}
                  </button>
                ) : null}
                {!okButton.hidden ? (
                  <button
                    type="button"
                    className={clsx(styles.footerBtn, toneClass(okButton.tone))}
                    onClick={confirmOk}
                  >
                    {okButton.label}
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function toneClass(tone?: string) {
  switch (tone) {
    case 'primary':
      return styles.tonePrimary;
    case 'danger':
      return styles.toneDanger;
    case 'success':
      return styles.toneSuccess;
    default:
      return styles.toneDefault;
  }
}
