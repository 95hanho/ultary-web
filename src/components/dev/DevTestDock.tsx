'use client';

import { bffDelete, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import {
  DEV_ACCESS_EXPIRES_AT_COOKIE,
  DEV_ACCESS_ISSUED_AT_COOKIE,
  DEV_ACCESS_VIA_REFRESH_COOKIE,
} from '@/lib/auth/cookie-names';
import { toLoginRequest } from '@/lib/auth/return-url';
import type { BffEnvelope } from '@/types/api';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
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

/** 로컬 시드 계정. 로그인 페이지 테스트 로그인에서만 쓴다. */
const TEST_LOGINS = [
  { nickname: '울타리', phone: '01011112222' },
  { nickname: '나리집사', phone: '01033334444' },
  { nickname: '산책러', phone: '01055556666' },
  { nickname: '대기중', phone: '01077778888' },
] as const;

const TEST_LOGIN_PASSWORD = 'Test1234!';

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
  const router = useRouter();
  const pathname = usePathname();
  const onLoginPage = pathname === '/login' || pathname.startsWith('/login/');
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
  const [testLoginOpen, setTestLoginOpen] = useState(false);
  const [testLoginPick, setTestLoginPick] = useState('');
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
                    const res = await bffDelete<BffEnvelope<{ revokedCount?: number }>>(
                      bffEndpoints.test.tokens,
                    );
                    refreshClearedRef.current = true;
                    const count = res.data?.revokedCount;
                    return typeof count === 'number'
                      ? `r토큰 ${count}개 폐기`
                      : 'r토큰을 폐기했습니다';
                  },
                })
              }
            >
              {busyId === 'reset-refresh-token' ? '…' : 'r토큰 초기화'}
            </button>
            <button
              type="button"
              className={clsx(styles.actionBtn, styles.statusAction)}
              disabled={Boolean(busyId)}
              onClick={() =>
                void run({
                  id: 'reset-access-token',
                  label: 'a토큰 초기화',
                  onClick: async () => {
                    await bffPostJson(bffEndpoints.test.accessTokenReset, {});
                    refreshClearedRef.current = true;
                    return 'a토큰을 지웠습니다';
                  },
                })
              }
            >
              {busyId === 'reset-access-token' ? '…' : 'a토큰 초기화'}
            </button>
            {onLoginPage ? (
              <>
                <button
                  type="button"
                  className={clsx(
                    styles.actionBtn,
                    styles.statusAction,
                    testLoginOpen && styles.testLoginCancel,
                  )}
                  disabled={Boolean(busyId)}
                  onClick={() => {
                    if (testLoginOpen) {
                      setTestLoginOpen(false);
                      setTestLoginPick('');
                      return;
                    }
                    setTestLoginOpen(true);
                  }}
                >
                  {busyId === 'test-login' ? '…' : testLoginOpen ? '선택취소' : '테스트로그인'}
                </button>
                {testLoginOpen ? (
                  <select
                    className={styles.testLoginSelect}
                    aria-label="테스트 로그인 닉네임"
                    value={testLoginPick}
                    disabled={Boolean(busyId)}
                    onChange={(event) => {
                      const phone = event.target.value;
                      setTestLoginPick('');
                      if (!phone) return;
                      const account = TEST_LOGINS.find((item) => item.phone === phone);
                      if (!account) return;
                      setTestLoginOpen(false);
                      void run({
                        id: 'test-login',
                        label: '테스트로그인',
                        onClick: async () => {
                          await bffPostJson(
                            bffEndpoints.auth.login,
                            toLoginRequest(account.phone, TEST_LOGIN_PASSWORD),
                          );
                          router.replace('/');
                          router.refresh();
                          return `${account.nickname} 로그인`;
                        },
                      });
                    }}
                  >
                    <option value="">-로그인 닉네임 선택-</option>
                    {TEST_LOGINS.map((account) => (
                      <option key={account.phone} value={account.phone}>
                        {account.nickname}
                      </option>
                    ))}
                  </select>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                className={clsx(styles.actionBtn, styles.statusAction)}
                disabled={Boolean(busyId)}
                onClick={() =>
                  void run({
                    id: 'logout',
                    label: '로그아웃',
                    onClick: async () => {
                      try {
                        await bffPostJson(bffEndpoints.auth.logout, {});
                      } catch (err) {
                        console.error('[DevTestDock] logout', err);
                      }
                      router.replace('/login');
                      router.refresh();
                      return '로그아웃했습니다';
                    },
                  })
                }
              >
                {busyId === 'logout' ? '…' : '로그아웃'}
              </button>
            )}
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
