'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NotificationInbox } from '@/app/(main)/notifications/NotificationInbox';
import styles from './PcNotificationDrawer.module.scss';

type PcNotificationDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/** PC 왼쪽 알림 팝업. 목록은 알림 페이지와 같다 */
export function PcNotificationDrawer({ open, onClose }: PcNotificationDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const mq = window.matchMedia('(max-width: 767px)');
    const onResize = () => {
      if (mq.matches) onClose();
    };
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onResize);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.root}>
      <button type="button" className={styles.dim} aria-label="알림 닫기" onClick={onClose} />
      <section className={styles.panel} role="dialog" aria-modal="true" aria-label="알림">
        <header className={styles.header}>
          <h2 className={styles.title}>알림</h2>
          <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
            <X size={22} strokeWidth={1.75} />
          </button>
        </header>
        <div className={styles.body}>
          <NotificationInbox variant="popup" />
        </div>
      </section>
    </div>,
    document.body,
  );
}
