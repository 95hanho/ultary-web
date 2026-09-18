'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NotificationPanel } from './NotificationPanel';
import styles from './NotificationModal.module.scss';

type NotificationModalProps = {
  open: boolean;
  onClose: () => void;
};

/** 데스크톱 전용 — 라우트 이동 없이 모달로 표시 */
export function NotificationModal({ open, onClose }: NotificationModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.root} role="presentation">
      <button
        type="button"
        className={styles.dim}
        aria-label="알림 닫기"
        onClick={onClose}
      />
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="알림"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>알림</h2>
          <button
            type="button"
            className={styles.close}
            aria-label="닫기"
            onClick={onClose}
          >
            <X size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <NotificationPanel compact />
      </div>
    </div>,
    document.body,
  );
}
