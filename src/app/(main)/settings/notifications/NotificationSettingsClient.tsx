'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import clsx from 'clsx';
import { useState } from 'react';
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

const INITIAL_ENABLED: Record<SettingKey, boolean> = {
  neighbor: true,
  likePost: true,
  likeComment: true,
  likeReply: true,
  commentOnPost: true,
  replyOnComment: true,
  mention: true,
  tagPost: true,
  tagStory: true,
  storyReact: true,
};

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={clsx(styles.switch, checked && styles.switchOn)}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} aria-hidden />
    </button>
  );
}

/** 설정 > 알림 설정 */
export default function NotificationSettingsClient() {
  const [enabled, setEnabled] = useState(INITIAL_ENABLED);

  function toggle(key: SettingKey, next: boolean) {
    setEnabled((prev) => ({ ...prev, [key]: next }));
    console.log('[notification-settings]', { key, enabled: next });
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="알림 설정" backHref="/settings" />

      <main className={styles.main}>
        <ul className={styles.list}>
          {SETTINGS.map((item) => (
            <li key={item.key} className={styles.item}>
              <div className={styles.itemBody}>
                <span className={styles.label}>{item.label}</span>
                <Switch
                  checked={enabled[item.key]}
                  label={item.label}
                  onChange={(next) => toggle(item.key, next)}
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
