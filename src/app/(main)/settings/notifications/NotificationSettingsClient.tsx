'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPatchJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import styles from './notifications-settings.module.scss';

type SettingKey =
  | 'neighbor'
  | 'likePost'
  | 'likeComment'
  | 'likeReply'
  | 'commentOnPost'
  | 'replyOnComment'
  | 'mention'
  | 'tagPost'
  | 'tagStory'
  | 'storyReact';

type SettingItem = {
  key: SettingKey;
  label: string;
  description?: string;
};

/** 알림 페이지 유형 기준 */
const SETTINGS: SettingItem[] = [
  { key: 'neighbor', label: '이웃 신청' },
  { key: 'likePost', label: '게시글 좋아요' },
  { key: 'likeComment', label: '댓글 좋아요' },
  { key: 'likeReply', label: '답글 좋아요' },
  { key: 'commentOnPost', label: '내 게시글 댓글' },
  { key: 'replyOnComment', label: '내 댓글 답글' },
  { key: 'mention', label: '댓글·답글 언급' },
  { key: 'tagPost', label: '게시글 태그' },
  { key: 'tagStory', label: '스토리 태그' },
  { key: 'storyReact', label: '스토리 공감' },
];

const SETTING_KEYS = SETTINGS.map((item) => item.key);

function allEnabled(): Record<SettingKey, boolean> {
  return Object.fromEntries(SETTING_KEYS.map((key) => [key, true])) as Record<
    SettingKey,
    boolean
  >;
}

function readFlag(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

function applySettings(
  base: Record<SettingKey, boolean>,
  data: unknown,
): Record<SettingKey, boolean> {
  if (!isRecord(data)) return base;
  const next = { ...base };
  for (const key of SETTING_KEYS) {
    const flag = readFlag(data[key]);
    if (flag !== undefined) next[key] = flag;
  }
  return next;
}

function readSettings(data: unknown): Record<SettingKey, boolean> {
  return applySettings(allEnabled(), data);
}

function pickErrorMessage(err: unknown, fallback: string) {
  if (isHttpError(err) && isRecord(err.data)) {
    const detail = err.data.detail;
    const message = err.data.message;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={clsx(styles.switch, checked && styles.switchOn)}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} aria-hidden />
    </button>
  );
}

/** 설정 > 알림 설정. GET/PATCH /settings/notifications */
export default function NotificationSettingsClient() {
  const [enabled, setEnabled] = useState(allEnabled);
  const [ready, setReady] = useState(false);
  const [pendingKey, setPendingKey] = useState<SettingKey | null>(null);
  const [status, setStatus] = useState('불러오는 중');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.settings.notifications);
        if (cancelled) return;
        setEnabled(readSettings(res.data));
        setStatus('');
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setStatus(pickErrorMessage(err, '알림 설정을 불러오지 못했습니다.'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(key: SettingKey, next: boolean) {
    if (!ready || pendingKey) return;
    const previous = enabled[key];
    setEnabled((prev) => ({ ...prev, [key]: next }));
    setPendingKey(key);
    setStatus('');
    try {
      const res = await bffPatchJson<BffEnvelope<unknown>>(bffEndpoints.settings.notifications, {
        [key]: next,
      });
      setEnabled((prev) => applySettings(prev, res.data));
    } catch (err) {
      setEnabled((prev) => ({ ...prev, [key]: previous }));
      setStatus(pickErrorMessage(err, '알림 설정을 바꾸지 못했습니다.'));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="알림 설정" backHref="/settings" />

      <main className={styles.main}>
        {status ? <p className={styles.status}>{status}</p> : null}
        <ul className={styles.list}>
          {SETTINGS.map((item) => (
            <li key={item.key} className={styles.item}>
              <div className={styles.itemBody}>
                <span className={styles.label}>{item.label}</span>
                <Switch
                  checked={enabled[item.key]}
                  label={item.label}
                  disabled={!ready || pendingKey != null}
                  onChange={(next) => void toggle(item.key, next)}
                />
              </div>
            </li>
          ))}
        </ul>
      </main>

      <FooterMenu />
    </div>
  );
}
