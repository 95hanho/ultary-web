'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPatchJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import type { FeedVisibility } from '@/types/enums';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import styles from './privacy.module.scss';

const VISIBILITY_OPTIONS: { value: FeedVisibility; label: string }[] = [
  { value: 'PUBLIC', label: '전체' },
  { value: 'NEIGHBORS', label: '이웃' },
  { value: 'PRIVATE', label: '나만' },
];

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

type PrivacySettings = {
  privateAccount: boolean;
  feedVisibility: FeedVisibility;
  storyVisibility: FeedVisibility;
  neighborRequest: boolean;
  allowComment: boolean;
  allowMention: boolean;
  allowTag: boolean;
};

const DEFAULT_PRIVACY: PrivacySettings = {
  privateAccount: false,
  feedVisibility: 'PUBLIC',
  storyVisibility: 'NEIGHBORS',
  neighborRequest: true,
  allowComment: true,
  allowMention: true,
  allowTag: true,
};

function parseVisibility(value: unknown): FeedVisibility | null {
  if (value === 'PUBLIC' || value === 'NEIGHBORS' || value === 'PRIVATE') return value;
  return null;
}

function readFlag(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

function readPrivacy(data: unknown): PrivacySettings {
  const source = isRecord(data) ? data : {};
  return {
    privateAccount: readFlag(source.privateAccount) ?? DEFAULT_PRIVACY.privateAccount,
    feedVisibility: parseVisibility(source.feedVisibility) ?? DEFAULT_PRIVACY.feedVisibility,
    storyVisibility: parseVisibility(source.storyVisibility) ?? DEFAULT_PRIVACY.storyVisibility,
    neighborRequest: readFlag(source.neighborRequest) ?? DEFAULT_PRIVACY.neighborRequest,
    allowComment: readFlag(source.allowComment) ?? DEFAULT_PRIVACY.allowComment,
    allowMention: readFlag(source.allowMention) ?? DEFAULT_PRIVACY.allowMention,
    allowTag: readFlag(source.allowTag) ?? DEFAULT_PRIVACY.allowTag,
  };
}

function applyPrivacy(prev: PrivacySettings, data: unknown): PrivacySettings {
  if (!isRecord(data)) return prev;
  return {
    privateAccount: readFlag(data.privateAccount) ?? prev.privateAccount,
    feedVisibility: parseVisibility(data.feedVisibility) ?? prev.feedVisibility,
    storyVisibility: parseVisibility(data.storyVisibility) ?? prev.storyVisibility,
    neighborRequest: readFlag(data.neighborRequest) ?? prev.neighborRequest,
    allowComment: readFlag(data.allowComment) ?? prev.allowComment,
    allowMention: readFlag(data.allowMention) ?? prev.allowMention,
    allowTag: readFlag(data.allowTag) ?? prev.allowTag,
  };
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

/** 설정 > 공개 범위. GET/PATCH /settings/privacy */
export default function PrivacyClient() {
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState('불러오는 중');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.settings.privacy);
        if (cancelled) return;
        setPrivacy(readPrivacy(res.data));
        setStatus('');
        setReady(true);
      } catch (err) {
        if (!cancelled) setStatus(pickErrorMessage(err, '공개 범위를 불러오지 못했습니다.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function patch(partial: Partial<PrivacySettings>) {
    if (!ready || pending) return;
    const previous = privacy;
    setPrivacy({ ...privacy, ...partial });
    setPending(true);
    setStatus('');
    try {
      const res = await bffPatchJson<BffEnvelope<unknown>>(bffEndpoints.settings.privacy, partial);
      setPrivacy((prev) => applyPrivacy(prev, res.data));
    } catch (err) {
      setPrivacy(previous);
      setStatus(pickErrorMessage(err, '공개 범위를 바꾸지 못했습니다.'));
    } finally {
      setPending(false);
    }
  }

  const locked = !ready || pending;

  return (
    <div className={styles.shell}>
      <PageHeader title="공개 범위" backHref="/settings" />

      <main className={styles.main}>
        {status ? <p className={styles.status}>{status}</p> : null}
        <ul className={styles.list}>
          <li className={styles.item}>
            <div className={styles.itemBody}>
              <div className={styles.textCol}>
                <span className={styles.label}>비공개 계정</span>
                <span className={styles.hint}>
                  켜면 전체 공개 게시글·스토리도 이웃만 볼 수 있어요.
                </span>
              </div>
              <Switch
                checked={privacy.privateAccount}
                label="비공개 계정"
                disabled={locked}
                onChange={(next) => void patch({ privateAccount: next })}
              />
            </div>
          </li>

          <li className={styles.item}>
            <VisibilityPicker
              label="게시글 기본 공개 범위"
              value={privacy.feedVisibility}
              disabled={locked}
              onChange={(next) => void patch({ feedVisibility: next })}
            />
          </li>

          <li className={styles.item}>
            <VisibilityPicker
              label="스토리 공개 범위"
              value={privacy.storyVisibility}
              disabled={locked}
              onChange={(next) => void patch({ storyVisibility: next })}
            />
          </li>

          <li className={styles.item}>
            <div className={styles.itemBody}>
              <span className={styles.label}>이웃 신청 받기</span>
              <Switch
                checked={privacy.neighborRequest}
                label="이웃 신청 받기"
                disabled={locked}
                onChange={(next) => void patch({ neighborRequest: next })}
              />
            </div>
          </li>

          <li className={styles.item}>
            <div className={styles.itemBody}>
              <span className={styles.label}>게시글 댓글 허용</span>
              <Switch
                checked={privacy.allowComment}
                label="게시글 댓글 허용"
                disabled={locked}
                onChange={(next) => void patch({ allowComment: next })}
              />
            </div>
          </li>

          <li className={styles.item}>
            <div className={styles.itemBody}>
              <span className={styles.label}>멘션 허용</span>
              <Switch
                checked={privacy.allowMention}
                label="멘션 허용"
                disabled={locked}
                onChange={(next) => void patch({ allowMention: next })}
              />
            </div>
          </li>

          <li className={styles.item}>
            <div className={styles.itemBody}>
              <span className={styles.label}>태그 허용</span>
              <Switch
                checked={privacy.allowTag}
                label="태그 허용"
                disabled={locked}
                onChange={(next) => void patch({ allowTag: next })}
              />
            </div>
          </li>
        </ul>
      </main>

      <FooterMenu />
    </div>
  );
}
