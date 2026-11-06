'use client';

import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import { useRef, useState, type MutableRefObject } from 'react';
import { adminMutationErrorMessage, notifyAdminMutationError } from './adminMutationError';
import { readTagRequest, type TagRequest } from './tagRequestData';
import styles from './admin.module.scss';

const TAG_STATUS: Record<string, string> = {
  PENDING: '대기',
  REJECTED: '거절',
  APPROVED: '승인',
};
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
  const rejectMessageRef = useRef(item.rejectMessage);
  const [submitting, setSubmitting] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const canAct = item.tagId != null;
  const selectValue = choice ?? item.status;

  const notify = (text: string) => {
    useModalStore.getState().open({
      variant: 'alert',
      title: '알림창',
      content: text,
      showCloseButton: true,
    });
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
    } catch (err) {
      console.error('[admin] tag status', err);
      setChoice(null);
      notifyAdminMutationError(err, actionError(err));
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  const reject = async (rejectMessage: string) => {
    if (!canAct || item.tagId == null || busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setChoice('REJECTED');
    try {
      const res = await bffPostJson<
        BffEnvelope<unknown>,
        { tagId: number; requestId: number; rejectMessage: string }
      >(bffEndpoints.admin.tagReject, {
        tagId: item.tagId,
        requestId: item.requestId,
        rejectMessage,
      });
      window.dispatchEvent(new Event('admin-status-changed'));
      onChange(mergeResult(item, res.data, { status: 'REJECTED', rejectMessage }));
      setChoice(null);
    } catch (err) {
      console.error('[admin] tag reject', err);
      setChoice(null);
      notifyAdminMutationError(err, actionError(err));
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  const openRejectModal = () => {
    rejectMessageRef.current = item.rejectMessage;
    useModalStore.getState().open({
      variant: 'confirm',
      title: '거절 메시지',
      showCloseButton: true,
      content: (
        <RejectMessageForm
          initial={item.rejectMessage}
          maxLength={MESSAGE_MAX}
          valueRef={rejectMessageRef}
        />
      ),
      okButton: {
        label: '거절',
        tone: 'danger',
        onClick: () => {
          const trimmed = rejectMessageRef.current.trim();
          if (!trimmed) {
            queueMicrotask(() => notify('거절 메시지를 입력해 주세요.'));
            return;
          }
          if (trimmed.length > MESSAGE_MAX) {
            queueMicrotask(() => notify('거절 메시지는 500자 이하여야 합니다.'));
            return;
          }
          void reject(trimmed);
        },
      },
      cancelButton: { label: '취소', tone: 'default' },
    });
  };

  const onStatus = (next: string) => {
    if (busy.current) return;
    if (next === 'REJECTED') {
      if (item.status === 'REJECTED') return;
      openRejectModal();
      return;
    }
    if (next === item.status) {
      setChoice(null);
      return;
    }
    if (next === 'APPROVED' || next === 'PENDING') void run(next);
  };

  return (
    <div className={styles.listStatusControl}>
      <FullScreenLoading
        open={submitting}
        label="태그 요청 상태를 변경하고 있습니다. 잠시만 기다려 주세요."
      />
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
      ) : (
        <p className={styles.detailNote}>태그 번호가 없어 상태를 바꿀 수 없습니다.</p>
      )}
    </div>
  );
}

function RejectMessageForm({
  initial,
  maxLength,
  valueRef,
}: {
  initial: string;
  maxLength: number;
  valueRef: MutableRefObject<string>;
}) {
  const [value, setValue] = useState(initial);
  valueRef.current = value;
  const count = value.trim().length;

  return (
    <div className={styles.messageField}>
      <label className={styles.messageLabel} htmlFor="admin-tag-reject-message">
        거절 사유
      </label>
      <textarea
        id="admin-tag-reject-message"
        className={styles.messageInput}
        value={value}
        maxLength={maxLength}
        rows={5}
        required
        placeholder="거절 사유를 입력해 주세요"
        onChange={(event) => setValue(event.target.value)}
      />
      <span className={styles.messageCount}>
        {count}/{maxLength}
      </span>
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
  }
  return adminMutationErrorMessage(err);
}
