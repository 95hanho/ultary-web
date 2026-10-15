'use client';

import { MediaImage } from '@/components/common/MediaImage';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import type { BffEnvelope } from '@/types/api';
import { useModalStore } from '@/stores/modal.store';
import Link from 'next/link';
import { useRef, useState } from 'react';
import styles from './admin.module.scss';

export type TagRequest = {
  requestId: number;
  tagId: number | null;
  hashtag: string;
  title: string;
  content: string;
  link: string;
  status: string;
  createdAt: string;
  reviewedAt: string;
  requesterUserNo: number | null;
  requesterNickname: string | null;
  rejectMessage: string;
  imageUrls: string[];
};

const TAG_STATUS: Record<string, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

const STATUS_TONE: Record<string, string> = {
  PENDING: 'toneWait',
  APPROVED: 'toneOk',
  REJECTED: 'toneNo',
};

const MESSAGE_MAX = 500;

const STATUS_OPTIONS = [
  { value: 'PENDING', label: '대기' },
  { value: 'REJECTED', label: '거절' },
  { value: 'APPROVED', label: '승인' },
] as const;

export default function TagRequestDetail({
  item,
  listHref,
  onChange,
}: {
  item: TagRequest;
  listHref: string;
  onChange: (item: TagRequest) => void;
}) {
  const busy = useRef(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const canAct = item.tagId != null;
  const trimmed = message.trim();
  const selectValue = choice ?? item.status;
  const rejecting = canAct && selectValue === 'REJECTED' && item.status !== 'REJECTED';

  const notify = (text: string) => {
    useModalStore.getState().open({
      variant: 'alert',
      title: '알림창',
      content: text,
      showCloseButton: true,
    });
  };

  const cancelReject = () => {
    setChoice(null);
    setMessage('');
  };

  const run = async (next: 'APPROVED' | 'PENDING') => {
    if (!canAct || item.tagId == null || busy.current || next === item.status) return;
    busy.current = true;
    setChoice(next);
    try {
      const res = await bffPostJson<BffEnvelope<unknown>, { tagId: number }>(
        next === 'APPROVED' ? bffEndpoints.admin.tagApprove : bffEndpoints.admin.tagPending,
        { tagId: item.tagId },
      );
      onChange(mergeResult(item, res.data, { status: next, rejectMessage: '' }));
      setChoice(null);
      setMessage('');
    } catch (err) {
      console.error('[admin] tag status', err);
      setChoice(null);
      notify(actionError(err));
    } finally {
      busy.current = false;
    }
  };

  const reject = async () => {
    if (!canAct || item.tagId == null || busy.current) return;
    if (!trimmed) {
      notify('거절 메시지를 입력해 주세요.');
      return;
    }
    if (trimmed.length > MESSAGE_MAX) {
      notify('거절 메시지는 500자 이하여야 합니다.');
      return;
    }
    busy.current = true;
    try {
      const res = await bffPostJson<BffEnvelope<unknown>, { tagId: number; rejectMessage: string }>(
        bffEndpoints.admin.tagReject,
        { tagId: item.tagId, rejectMessage: trimmed },
      );
      onChange(mergeResult(item, res.data, { status: 'REJECTED', rejectMessage: trimmed }));
      setChoice(null);
      setMessage('');
    } catch (err) {
      console.error('[admin] tag reject', err);
      notify(actionError(err));
    } finally {
      busy.current = false;
    }
  };

  const onStatus = (next: string) => {
    if (busy.current) return;
    if (next === 'REJECTED') {
      if (item.status === 'REJECTED') {
        setChoice(null);
        return;
      }
      setChoice('REJECTED');
      setMessage(item.rejectMessage);
      return;
    }
    if (next === item.status) {
      cancelReject();
      return;
    }
    if (next === 'APPROVED' || next === 'PENDING') void run(next);
  };

  return (
    <div className={styles.detail}>
      <div className={styles.detailScroll}>
        <p className={styles.detailHash}>
          #{item.hashtag}
          <span className={`${badgeClass(item.status)} ${styles.detailTitleBadge}`}>
            {TAG_STATUS[item.status] ?? item.status}
          </span>
        </p>
        <p className={styles.detailMeta}>
          {item.tagId != null ? `태그 ${item.tagId}` : '태그 번호 없음'}
          {item.requesterUserNo != null
            ? ` · ${memberLabel(item.requesterUserNo, item.requesterNickname)}`
            : ''}
        </p>
        <p className={styles.detailMeta}>
          요청 {formatWhen(item.createdAt)}
          {item.reviewedAt ? ` · 검토 ${formatWhen(item.reviewedAt)}` : ''}
        </p>
        {item.imageUrls.length > 0 ? (
          <div className={styles.detailImages}>
            {item.imageUrls.map((url) => (
              <span key={url} className={styles.detailImage}>
                <MediaImage src={url} alt="" width={120} height={120} className={styles.detailImageImg} />
              </span>
            ))}
          </div>
        ) : (
          <p className={styles.detailMeta}>이미지 없음</p>
        )}
        <Field label="제목" value={item.title} />
        <Field label="소개" value={item.content} />
        <Field label="링크" value={item.link} href={item.link} />
        {item.status === 'REJECTED' ? (
          <>
            <hr className={styles.detailRule} />
            <Field label="거절 메시지" value={item.rejectMessage} />
          </>
        ) : null}
      </div>
      <div className={styles.detailActions}>
        {rejecting ? (
          <div className={styles.messageField}>
            <span className={styles.messageLabel}>거절 메시지</span>
            <textarea
              className={styles.messageInput}
              value={message}
              maxLength={MESSAGE_MAX}
              rows={4}
              required
              placeholder="거절 사유를 입력해 주세요"
              onChange={(event) => setMessage(event.target.value)}
            />
            <span className={styles.messageCount}>
              {trimmed.length}/{MESSAGE_MAX}
            </span>
            <div className={styles.messageActions}>
              <button type="button" className={styles.backButton} onClick={cancelReject}>
                취소
              </button>
              <button type="button" className={styles.rejectButton} onClick={() => void reject()}>
                거절
              </button>
            </div>
          </div>
        ) : null}
        {!canAct ? <p className={styles.detailNote}>태그 번호가 없어 상태를 바꿀 수 없습니다.</p> : null}
        <div className={styles.actionRow}>
          <Link href={listHref} className={styles.backButton}>
            목록
          </Link>
          {canAct ? (
            <select
              className={styles.statusSelect}
              aria-label="상태 변경"
              value={selectValue}
              onChange={(event) => {
                if (busy.current) {
                  event.target.value = selectValue;
                  return;
                }
                onStatus(event.target.value);
              }}
            >
              {statusOptions(selectValue).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  const text = value.trim();
  const link = href && /^https?:\/\//i.test(href.trim()) ? href.trim() : '';
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {text ? (
        link ? (
          <a className={styles.fieldLink} href={link} target="_blank" rel="noreferrer">
            {text}
          </a>
        ) : (
          <p className={styles.fieldValue}>{text}</p>
        )
      ) : (
        <p className={styles.fieldEmpty}>없음</p>
      )}
    </div>
  );
}

function statusOptions(current: string) {
  if (STATUS_OPTIONS.some((option) => option.value === current)) return STATUS_OPTIONS;
  return [{ value: current, label: TAG_STATUS[current] ?? current }, ...STATUS_OPTIONS];
}

function badgeClass(status: string) {
  const tone = STATUS_TONE[status];
  return tone ? `${styles.badge} ${styles[tone]}` : styles.badge;
}

function memberLabel(userNo: number, nickname: string | null) {
  return nickname ? `no.${userNo}(${nickname})` : `no.${userNo}`;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
}

function mergeResult(
  current: TagRequest,
  raw: unknown,
  fallback: Pick<TagRequest, 'status' | 'rejectMessage'>,
) {
  const next = isRecord(raw) ? readTagRequest(raw) : null;
  if (next) return next;
  return { ...current, ...fallback };
}

export function readTagRequest(item: Record<string, unknown>): TagRequest | null {
  if (typeof item.requestId !== 'number') return null;
  const hashtag = typeof item.hashtag === 'string' ? item.hashtag.trim().replace(/^#/, '') : '';
  if (!hashtag) return null;
  const imageUrls = imageUrlsOf(item.images);
  return {
    requestId: item.requestId,
    tagId: typeof item.tagId === 'number' ? item.tagId : null,
    hashtag,
    title: textOf(item.title),
    content: textOf(item.content),
    link: textOf(item.link),
    status: typeof item.status === 'string' ? item.status : '',
    createdAt: textOf(item.createdAt),
    reviewedAt: textOf(item.reviewedAt),
    requesterUserNo: typeof item.requesterUserNo === 'number' ? item.requesterUserNo : null,
    requesterNickname: textOf(item.requesterNickname) || null,
    rejectMessage: textOf(item.rejectMessage),
    imageUrls,
  };
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function imageUrlsOf(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const urls: string[] = [];
  for (const image of raw) {
    if (!isRecord(image) || typeof image.filePath !== 'string') continue;
    const fileId = typeof image.fileId === 'number' ? image.fileId : Number(image.fileId);
    if (!Number.isFinite(fileId)) continue;
    const url = resolveFileDisplayUrl({ fileId, filePath: image.filePath });
    if (url) urls.push(url);
  }
  return urls;
}

function actionError(err: unknown) {
  if (isHttpError(err)) {
    if (err.message === 'TAG_PROFILE_REQUEST_NOT_FOUND') return '요청을 찾지 못했습니다.';
    if (err.message.includes('500')) return '거절 메시지는 500자 이하여야 합니다.';
    if (err.message.trim()) return err.message;
  }
  return '처리하지 못했습니다.';
}
