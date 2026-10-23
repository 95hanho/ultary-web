'use client';
import { useRef, useState } from 'react';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import { readTagRequest, type TagRequest } from './tagRequestData';
import styles from './admin.module.scss';
const TAG_STATUS: Record<string, string> = { PENDING: '대기', REJECTED: '거절', APPROVED: '승인' };
const MESSAGE_MAX = 500;
const STATUS_OPTIONS = [
  { value: 'PENDING', label: '대기' },
  { value: 'REJECTED', label: '거절' },
  { value: 'APPROVED', label: '승인' },
];
export default function TagStatusControl({
  item,
  onChange,
}: {
  item: TagRequest;
  onChange: (item: TagRequest) => void;
}) {
  const busy = useRef(false);
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);
    setChoice(next);
    try {
      const res = await bffPostJson<BffEnvelope<unknown>, { tagId: number; requestId: number }>(
        next === 'APPROVED' ? bffEndpoints.admin.tagApprove : bffEndpoints.admin.tagPending,
        { tagId: item.tagId, requestId: item.requestId },
      );
      window.dispatchEvent(new Event('admin-status-changed'));
      onChange(mergeResult(item, res.data, { status: next, rejectMessage: '' }));
      setChoice(null);
      setMessage('');
    } catch (err) {
      console.error('[admin] tag status', err);
      setChoice(null);
      notify(actionError(err));
    } finally {
      busy.current = false;
      setSubmitting(false);
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
    setSubmitting(true);
    try {
      const res = await bffPostJson<
        BffEnvelope<unknown>,
        { tagId: number; requestId: number; rejectMessage: string }
      >(bffEndpoints.admin.tagReject, {
        tagId: item.tagId,
        requestId: item.requestId,
        rejectMessage: trimmed,
      });
      window.dispatchEvent(new Event('admin-status-changed'));
      onChange(mergeResult(item, res.data, { status: 'REJECTED', rejectMessage: trimmed }));
      setChoice(null);
      setMessage('');
    } catch (err) {
      console.error('[admin] tag reject', err);
      notify(actionError(err));
    } finally {
      busy.current = false;
      setSubmitting(false);
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
    <div className={styles.listStatusControl}>
      {canAct ? (
        <select
          className={styles.statusSelect}
          aria-label="상태 변경"
          disabled={submitting}
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
      ) : null}{' '}
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
      {!canAct ? (
        <p className={styles.detailNote}>태그 번호가 없어 상태를 바꿀 수 없습니다.</p>
      ) : null}
    </div>
  );
}
function statusOptions(current: string) {
  if (STATUS_OPTIONS.some((option) => option.value === current)) return STATUS_OPTIONS;
  return [{ value: current, label: TAG_STATUS[current] ?? current }, ...STATUS_OPTIONS];
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

function actionError(err: unknown) {
  if (isHttpError(err)) {
    if (err.message === 'TAG_PROFILE_REQUEST_NOT_FOUND') return '요청을 찾지 못했습니다.';
    if (err.message.includes('500')) return '거절 메시지는 500자 이하여야 합니다.';
    if (err.message.trim()) return err.message;
  }
  return '처리하지 못했습니다.';
}
