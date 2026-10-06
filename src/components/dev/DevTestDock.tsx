'use client';

import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import {
  DEV_ACCESS_EXPIRES_AT_COOKIE,
  DEV_ACCESS_ISSUED_AT_COOKIE,
  DEV_ACCESS_VIA_REFRESH_COOKIE,
} from '@/lib/auth/cookie-names';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './DevTestDock.module.scss';

export type DevTestAction = {
  id: string;
  label: string;
  /** 문자열을 반환하면 패널에 성공 메시지로 보여 준다 */
  onClick: () => void | Promise<void | string>;
  disabled?: boolean;
};

function actionErrorMessage(err: unknown) {
  if (isHttpError(err) && isRecord(err.data)) {
    const detail = err.data.detail;
    const message = err.data.message;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return '실패';
}

export type DevTestGroup = {
  id: string;
  title: string;
  actions: DevTestAction[];
};

type Props = {
  groups: DevTestGroup[];
};

function readCookie(name: string) {
  const prefix = `${name}=`;
  const part = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  if (!part) return '';
  return decodeURIComponent(part.slice(prefix.length));
}

function formatRemain(ms: number) {
  if (ms <= 0) return '만료됨';
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${minutes}:${ss}`;
}

function formatClock(ms: number) {
  return new Date(ms).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * development 전용 테스트 도크.
 * 우하단 fixed · 숨기기면 우측으로 접히고 ◀ 로 다시 펼침.
 * 액세스 토큰 예상 만료는 항상 보이고, 페이지 버튼은 그 아래에 붙는다.
 */
export function DevTestDock({ groups }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [issuedAt, setIssuedAt] = useState<number | null>(null);
  const [viaRefresh, setViaRefresh] = useState(false);
  const [refreshFresh, setRefreshFresh] = useState(false);
  const seenIssuedRef = useRef<number | null>(null);
  /** r토큰을 지운 뒤, 다음 재발급이 오면 그 알림을 지운다 */
  const refreshClearedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => {
      const expires = Number(readCookie(DEV_ACCESS_EXPIRES_AT_COOKIE));
      const issued = Number(readCookie(DEV_ACCESS_ISSUED_AT_COOKIE));
      const refreshed = readCookie(DEV_ACCESS_VIA_REFRESH_COOKIE) === '1';
      const nextExpires = Number.isFinite(expires) && expires > 0 ? expires : null;
      const nextIssued = Number.isFinite(issued) && issued > 0 ? issued : null;
      setNow(Date.now());
      setExpiresAt(nextExpires);
      setIssuedAt(nextIssued);
      setViaRefresh(refreshed);
      if (
        seenIssuedRef.current != null &&
        nextIssued != null &&
        nextIssued !== seenIssuedRef.current &&
        refreshed
      ) {
        setRefreshFresh(true);
        if (refreshClearedRef.current) {
          refreshClearedRef.current = false;
          setMessage(null);
        }
      }
      if (nextIssued != null) seenIssuedRef.current = nextIssued;
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [mounted]);

  useEffect(() => {
    if (!refreshFresh) return;
    const id = window.setTimeout(() => setRefreshFresh(false), 4000);
    return () => window.clearTimeout(id);
  }, [refreshFresh]);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!mounted) return null;

  const remain = expiresAt == null ? null : expiresAt - now;

  const run = async (action: DevTestAction) => {
    if (busyId) return;
    setBusyId(action.id);
    setMessage(null);
    setMessageOk(false);
    try {
      const result = await action.onClick();
      if (typeof result === 'string' && result.trim()) {
        setMessage(result);
        setMessageOk(true);
      }
    } catch (err) {
      setMessage(actionErrorMessage(err));
      setMessageOk(false);
      console.error('[DevTestDock]', action.id, err);
    } finally {
      setBusyId(null);
    }
  };

  return createPortal(
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
            <span className={styles.panelTitle}>DEV</span>
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
          <div className={styles.status}>
            <span className={clsx(styles.timer, remain != null && remain <= 0 && styles.timerExpired)}>
              {remain == null ? 'a토큰 없음' : `a토큰 ${formatRemain(remain)}`}
            </span>
            {expiresAt != null ? (
              <p className={styles.meta}>{formatClock(expiresAt)} 만료</p>
            ) : (
              <p className={styles.meta}>로그인 후 예상 만료 시각이 나옵니다</p>
            )}
            {viaRefresh && issuedAt != null ? (
              <p className={clsx(styles.refreshNote, refreshFresh && styles.refreshFresh)}>
                {formatClock(issuedAt)} 재발급
              </p>
            ) : null}
            <button
              type="button"
              className={clsx(styles.actionBtn, styles.statusAction)}
              disabled={Boolean(busyId)}
              onClick={() =>
                void run({
                  id: 'reset-refresh-token',
                  label: 'r토큰 초기화',
                  onClick: async () => {
                    await bffPostJson(bffEndpoints.test.refreshTokenReset, {});
                    refreshClearedRef.current = true;
                    return 'r토큰을 지웠습니다';
                  },
                })
              }
            >
              {busyId === 'reset-refresh-token' ? '…' : 'r토큰 초기화'}
            </button>
          </div>
          {groups.map((group) => (
            <div key={group.id}>
              <p className={styles.groupTitle}>{group.title}</p>
              <div className={styles.actions}>
                {group.actions.map((action) => (
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
            </div>
          ))}
          {message ? (
            <p className={clsx(styles.message, messageOk && styles.messageOk)}>{message}</p>
          ) : null}
        </div>
      )}
    </div>,
    document.body,
  );
}
