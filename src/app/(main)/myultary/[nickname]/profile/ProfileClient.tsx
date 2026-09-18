'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import styles from './profile.module.scss';

type ProfileClientProps = {
  nickname: string;
};

/** 마이울타리 — 프로필 등록/수정 */
export default function ProfileClient({ nickname }: ProfileClientProps) {
  const router = useRouter();
  const basePath = myUltaryPath(nickname);
  const [displayName, setDisplayName] = useState(nickname || MY_NICKNAME);
  const [bio, setBio] = useState('오늘 공유한 나의 울타리 동물');
  const [saved, setSaved] = useState(false);

  function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!displayName.trim()) return;
    setSaved(true);
    window.setTimeout(() => {
      router.push(basePath);
    }, 400);
  }

  return (
    <div className={styles.shell}>
      <PageHeader
        title="프로필 등록"
        backHref={basePath}
        right={
          <button
            type="button"
            className={styles.saveBtn}
            disabled={!displayName.trim()}
            onClick={() => onSubmit()}
          >
            저장
          </button>
        }
      />

      <main className={styles.main}>
        <form id="profile-form" className={styles.form} onSubmit={onSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>닉네임</span>
            <input
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="닉네임을 입력해주세요."
              maxLength={20}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>소개</span>
            <textarea
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="소개글을 입력해주세요."
              rows={4}
              maxLength={120}
            />
            <span className={styles.counter}>{bio.length}/120</span>
          </label>

          {saved ? (
            <p className={styles.toast} role="status">
              저장되었습니다.
            </p>
          ) : null}
        </form>
      </main>
    </div>
  );
}
