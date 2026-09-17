'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPatchJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import type { BffEnvelope, UserSettings } from '@/types/api';
import type { FeedVisibility } from '@/types/enums';
import clsx from 'clsx';
import { useEffect, useState, useTransition } from 'react';
import styles from './privacy.module.scss';

const VISIBILITY_OPTIONS: { value: FeedVisibility; label: string }[] = [
  { value: 'PUBLIC', label: '전체' },
  { value: 'NEIGHBORS', label: '이웃' },
  { value: 'PRIVATE', label: '나만' },
];

type ToggleKey = 'privateAccount' | 'neighborRequest' | 'allowTag' | 'allowMention' | 'allowComment';

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
      disabled={disabled}
      className={clsx(styles.switch, checked && styles.switchOn)}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.switchThumb} aria-hidden />
    </button>
  );
}

function VisibilityPicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: FeedVisibility;
  onChange: (next: FeedVisibility) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.visibilityBlock}>
      <p className={styles.label}>{label}</p>
      <div className={styles.optionRow} role="radiogroup" aria-label={label}>
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            disabled={disabled}
            className={clsx(styles.option, value === opt.value && styles.optionActive)}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function parseVisibility(value: unknown): FeedVisibility | null {
  if (value === 'PUBLIC' || value === 'NEIGHBORS' || value === 'PRIVATE') return value;
  return null;
}

/** 설정 > 공개 범위 */
export default function PrivacyClient() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [feedVisibility, setFeedVisibility] = useState<FeedVisibility>('PUBLIC');
  const [storyVisibility, setStoryVisibility] = useState<FeedVisibility>('NEIGHBORS');
  const [neighborRequest, setNeighborRequest] = useState(true);
  const [allowTag, setAllowTag] = useState(true);
  const [allowMention, setAllowMention] = useState(true);
  const [allowComment, setAllowComment] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<UserSettings>>(bffEndpoints.settings.root);
        const settings = res.data;
        if (!settings || cancelled) return;
        const visibility = parseVisibility(settings.profileVisibility);
        if (visibility) {
          setFeedVisibility(visibility);
          setPrivateAccount(visibility !== 'PUBLIC');
        }
      } catch (err) {
        console.error('[privacy] load', err);
        if (!cancelled) {
          setError('설정을 불러오지 못했습니다. 로컬 기본값으로 표시합니다.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function saveProfileVisibility(next: FeedVisibility) {
    setError(null);
    startTransition(async () => {
      try {
        await bffPatchJson(bffEndpoints.settings.root, {
          profileVisibility: next,
        });
      } catch (err) {
        console.error('[privacy] save', err);
        setError('공개 범위 저장에 실패했습니다.');
      }
    });
  }

  function setToggle(key: ToggleKey, next: boolean) {
    console.log('[privacy]', { key, enabled: next });
    switch (key) {
      case 'privateAccount':
        setPrivateAccount(next);
        if (next) {
          setFeedVisibility('NEIGHBORS');
          setStoryVisibility('NEIGHBORS');
          saveProfileVisibility('NEIGHBORS');
        } else {
          setFeedVisibility('PUBLIC');
          saveProfileVisibility('PUBLIC');
        }
        break;
      case 'neighborRequest':
        setNeighborRequest(next);
        break;
      case 'allowTag':
        setAllowTag(next);
        break;
      case 'allowMention':
        setAllowMention(next);
        break;
      case 'allowComment':
        setAllowComment(next);
        break;
    }
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="공개 범위" backHref="/settings" />

      <main className={styles.main}>
        {error ? <p className={styles.hint}>{error}</p> : null}
        <ul className={styles.list}>
          <li className={styles.item}>
            <div className={styles.itemBody}>
              <div className={styles.textCol}>
                <span className={styles.label}>비공개 계정</span>
                <span className={styles.hint}>
                  켜면 이웃만 게시글·스토리를 볼 수 있어요.
                </span>
              </div>
              <Switch
                checked={privateAccount}
                label="비공개 계정"
                disabled={pending}
                onChange={(next) => setToggle('privateAccount', next)}
              />
            </div>
          </li>

          <li className={styles.item}>
            <VisibilityPicker
              label="게시글 기본 공개 범위"
              value={feedVisibility}
              disabled={pending}
              onChange={(next) => {
                setFeedVisibility(next);
                setPrivateAccount(next !== 'PUBLIC');
                saveProfileVisibility(next);
              }}
            />
          </li>

          <li className={styles.item}>
            <VisibilityPicker
              label="스토리 공개 범위"
              value={storyVisibility}
              disabled={pending}
              onChange={(next) => {
                setStoryVisibility(next);
                console.log('[privacy]', { key: 'storyVisibility', value: next });
              }}
            />
          </li>

          <li className={styles.item}>
            <div className={styles.itemBody}>
              <span className={styles.label}>이웃 신청 받기</span>
              <Switch
                checked={neighborRequest}
                label="이웃 신청 받기"
                onChange={(next) => setToggle('neighborRequest', next)}
              />
            </div>
          </li>

          <li className={styles.item}>
            <div className={styles.itemBody}>
              <span className={styles.label}>게시글 댓글 허용</span>
              <Switch
                checked={allowComment}
                label="게시글 댓글 허용"
                onChange={(next) => setToggle('allowComment', next)}
              />
            </div>
          </li>

          <li className={styles.item}>
            <div className={styles.itemBody}>
              <span className={styles.label}>멘션 허용</span>
              <Switch
                checked={allowMention}
                label="멘션 허용"
                onChange={(next) => setToggle('allowMention', next)}
              />
            </div>
          </li>

          <li className={styles.item}>
            <div className={styles.itemBody}>
              <span className={styles.label}>태그 허용</span>
              <Switch
                checked={allowTag}
                label="태그 허용"
                onChange={(next) => setToggle('allowTag', next)}
              />
            </div>
          </li>
        </ul>
      </main>

      <FooterMenu />
    </div>
  );
}
