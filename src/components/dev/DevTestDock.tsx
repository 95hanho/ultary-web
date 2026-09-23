'use client';

import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import styles from './DevTestDock.module.scss';

export type DevTestAction = {
  id: string;
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
};

type Props = {
  /** 패널 제목 (작게) */
  title?: string;
  actions: DevTestAction[];
};

/**
 * development 전용 테스트 도크.
 * 우하단 fixed · 숨기기면 우측으로 접히고 ◀ 로 다시 펼침.
 * 테스트 액션이 있는 페이지에서만 마운트한다.
 */
export function DevTestDock({ title = 'DEV', actions }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (process.env.NODE_ENV !== 'development') return null;
  if (actions.length === 0) return null;

  const run = async (action: DevTestAction) => {
    if (busyId) return;
    setBusyId(action.id);
    setMessage(null);
    try {
      await action.onClick();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '실패';
      setMessage(msg);
      console.error('[DevTestDock]', action.id, err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className={clsx(styles.dock, collapsed && styles.collapsed)}
      data-dev-test-dock
    >
      {collapsed ? (
        <button
          type="button"
          className={styles.peekBtn}
          aria-label="테스트 패널 열기"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
      ) : (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>{title}</span>
            <button
              type="button"
              className={styles.hideBtn}
              aria-label="테스트 패널 숨기기"
              onClick={() => setCollapsed(true)}
            >
              숨기기
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
          <div className={styles.actions}>
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={styles.actionBtn}
                disabled={Boolean(busyId) || action.disabled}
                onClick={() => void run(action)}
              >
                {busyId === action.id ? '…' : action.label}
              </button>
            ))}
          </div>
          {message ? <p className={styles.message}>{message}</p> : null}
        </div>
      )}
    </div>
  );
}
