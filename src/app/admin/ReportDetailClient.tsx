'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  REPORT_REASON,
  REPORT_STATUS,
  TARGET_TYPE,
  findReport,
  formatWhen,
  memberLabel,
  type ReportItem,
} from './adminData';
import { badgeClass } from './adminListUi';
import styles from './admin.module.scss';

const CONTENT_TYPE = new Set(['FEED', 'COMMENT', 'REPLY']);

const ACTION_URL: Record<string, string> = {
  CONFIRMED: bffEndpoints.admin.reportConfirm,
  REJECTED: bffEndpoints.admin.reportReject,
  DELETED: bffEndpoints.admin.reportDeleteContent,
  SUSPENDED: bffEndpoints.admin.reportSuspend,
};

export default function ReportDetailClient({ reportId }: { reportId: number }) {
  const busy = useRef(false);
  const [item, setItem] = useState<ReportItem | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await findReport(reportId);
        if (cancelled) return;
        if (!found) {
          setState('missing');
          return;
        }
        if (found.status !== 'REQUESTED') {
          setItem(found);
          setState('ready');
          return;
        }
        try {
          const res = await bffPostJson<BffEnvelope<unknown>, { reportId: number }>(
            bffEndpoints.admin.reportConfirm,
            { reportId: found.reportId },
          );
          if (cancelled) return;
          setItem(mergeReport(found, res.data, 'CONFIRMED'));
          setState('ready');
        } catch (err) {
          console.error('[admin] report confirm on open', err);
          if (cancelled) return;
          setItem(found);
          setState('ready');
          useModalStore.getState().open({
            variant: 'alert',
            title: '알림창',
            content: actionError(err),
            showCloseButton: true,
          });
        }
      } catch (err) {
        console.error('[admin] report detail', err);
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (state === 'loading') {
    return (
      <section className={styles.paneFull}>
        <p className={styles.empty}>불러오는 중</p>
      </section>
    );
  }
  if (state === 'error' || state === 'missing' || !item) {
    return <PageLoadError />;
  }

  const typeLabel = TARGET_TYPE[item.targetType] ?? item.targetType;
  const reasonLabel = REPORT_REASON[item.reason] ?? item.reason;
  const selectValue = choice ?? item.status;
  const options = actionOptions(item, selectValue);
  const canAct = options.length > 1;

  const notify = (text: string) => {
    useModalStore.getState().open({
      variant: 'alert',
      title: '알림창',
      content: text,
      showCloseButton: true,
    });
  };

  const onAction = async (next: string) => {
    if (busy.current || next === item.status) {
      setChoice(null);
      return;
    }
    const url = ACTION_URL[next];
    if (!url) return;
    busy.current = true;
    setChoice(next);
    try {
      const res = await bffPostJson<BffEnvelope<unknown>, { reportId: number }>(url, {
        reportId: item.reportId,
      });
      setItem(mergeReport(item, res.data, next));
      setChoice(null);
    } catch (err) {
      console.error('[admin] report action', err);
      setChoice(null);
      notify(actionError(err));
    } finally {
      busy.current = false;
    }
  };

  return (
    <div className={styles.detail}>
      <div className={styles.detailScroll}>
        <p className={styles.detailHash}>
          신고 {item.reportId}
          <span className={`${badgeClass(item.status)} ${styles.badgeReport} ${styles.detailTitleBadge}`}>
            {REPORT_STATUS[item.status] ?? item.status}
          </span>
        </p>
        <p className={styles.detailMeta}>
          {reasonLabel ? `${typeLabel} / ${reasonLabel}` : typeLabel}
        </p>
        <p className={styles.detailMeta}>
          접수 {formatWhen(item.createdAt)}
          {item.processedAt ? ` · 처리 ${formatWhen(item.processedAt)}` : ''}
        </p>
        <Field label="대상" value={item.detail} />
        <Field
          label="신고 회원"
          value={item.reporterUserNo != null ? memberLabel(item.reporterUserNo, null) : ''}
        />
        <Field
          label="대상 회원"
          value={item.targetUserNo != null ? memberLabel(item.targetUserNo, item.targetNickname || null) : ''}
          note={item.targetSuspended ? '* 정지된 회원입니다' : ''}
        />
        <Field label="게시글" value={item.targetFeedId != null ? String(item.targetFeedId) : ''} />
        <Field label="댓글" value={item.targetCommentId != null ? String(item.targetCommentId) : ''} />
        <Field label="답글" value={item.targetReplyId != null ? String(item.targetReplyId) : ''} />
      </div>
      <div className={styles.detailActions}>
        <div className={styles.actionRow}>
          <Link href="/admin/reports" className={styles.backButton}>
            목록
          </Link>
          <select
            className={styles.statusSelect}
            aria-label="신고 처리"
            value={selectValue}
            disabled={!canAct}
            onChange={(event) => {
              if (busy.current) {
                event.target.value = selectValue;
                return;
              }
              void onAction(event.target.value);
            }}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function actionOptions(item: ReportItem, shown: string) {
  const values = ['CONFIRMED', 'REJECTED'];
  if (item.targetType === 'USER') values.push('SUSPENDED');
  else if (CONTENT_TYPE.has(item.targetType)) values.push('DELETED');
  if (item.status === 'REQUESTED') values.unshift('REQUESTED');
  else if (item.status && !values.includes(item.status)) values.unshift(item.status);
  if (shown && !values.includes(shown)) values.unshift(shown);
  return values.map(statusOption);
}

function statusOption(value: string) {
  return { value, label: REPORT_STATUS[value] ?? value };
}

function mergeReport(current: ReportItem, raw: unknown, status: string): ReportItem {
  const source = isRecord(raw) ? raw : null;
  const nextStatus = source && typeof source.status === 'string' ? source.status : status;
  return {
    ...current,
    status: nextStatus,
    processedAt:
      source && typeof source.processedAt === 'string' ? source.processedAt : current.processedAt,
    targetSuspended: suspendedOf(source, nextStatus, current),
  };
}

function suspendedOf(
  source: Record<string, unknown> | null,
  nextStatus: string,
  current: ReportItem,
) {
  if (source && typeof source.targetSuspended === 'boolean') return source.targetSuspended;
  if (nextStatus === 'SUSPENDED') return true;
  if (current.status === 'SUSPENDED') return false;
  return current.targetSuspended;
}

function actionError(err: unknown) {
  const code = errorCode(err);
  if (code === 'REPORT_NOT_FOUND') return '신고를 찾지 못했습니다.';
  if (code === 'REPORT_ALREADY_CLOSED') return '이미 처리된 신고입니다.';
  if (code === 'REPORT_ACTION_MISMATCH') return '이 신고에는 할 수 없는 처리입니다.';
  if (isHttpError(err) && err.message.trim()) return err.message;
  return '처리하지 못했습니다.';
}

function errorCode(err: unknown) {
  if (!isHttpError(err)) return '';
  if (isRecord(err.data)) {
    if (typeof err.data.code === 'string') return err.data.code;
    if (isRecord(err.data.data) && typeof err.data.data.code === 'string') return err.data.data.code;
  }
  return err.message;
}

function Field({ label, value, note }: { label: string; value: string; note?: string }) {
  const text = value.trim();
  const aside = note?.trim() ?? '';
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {text || aside ? (
        <p className={text ? styles.fieldValue : styles.fieldEmpty}>
          {text || '없음'}
          {aside ? <span className={styles.suspendedNote}>{aside}</span> : null}
        </p>
      ) : (
        <p className={styles.fieldEmpty}>없음</p>
      )}
    </div>
  );
}
