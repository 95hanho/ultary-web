'use client';

import { PageLoadError } from '@/components/common/PageLoadError';
import { httpErrorStatus } from '@/lib/api/error';

import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
import ReportFeedPreview from './ReportFeedPreview';
import ReportStatusControl from './ReportStatusControl';
import { mergeReport, actionError } from './reportStatusActions';

const CONTENT_TYPE = new Set(['FEED', 'COMMENT', 'REPLY']);

export default function ReportDetailClient({ reportId }: { reportId: number }) {
  const [item, setItem] = useState<ReportItem | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [failureStatus, setFailureStatus] = useState(500);

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
        if (!cancelled) {
          setFailureStatus(httpErrorStatus(err));
          setState('error');
        }
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
    return <PageLoadError status={state === 'missing' ? 404 : failureStatus} />;
  }

  const typeLabel = TARGET_TYPE[item.targetType] ?? item.targetType;
  const reasonLabel = REPORT_REASON[item.reason] ?? item.reason;

  return (
    <div className={styles.detail}>
      <div
        className={`${styles.detailScroll} ${CONTENT_TYPE.has(item.targetType) ? styles.reportDetailColumns : ''}`}
      >
        <div className={styles.reportDetailInfo}>
          <p className={styles.detailHash}>
            신고 {item.reportId}
            <span
              className={`${badgeClass(item.status)} ${styles.badgeReport} ${styles.detailTitleBadge}`}
            >
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
            value={
              item.targetUserNo != null
                ? memberLabel(item.targetUserNo, item.targetNickname || null)
                : ''
            }
            note={item.targetSuspended ? '* 정지된 회원입니다' : ''}
          />
          <Field
            label="게시글"
            value={item.targetFeedId != null ? String(item.targetFeedId) : ''}
          />
          <Field
            label="댓글"
            value={item.targetCommentId != null ? String(item.targetCommentId) : ''}
          />
          <Field
            label="답글"
            value={item.targetReplyId != null ? String(item.targetReplyId) : ''}
          />
        </div>
        {CONTENT_TYPE.has(item.targetType) ? (
          <aside className={styles.reportPreviewColumn} aria-label="신고 대상 피드 미리보기">
            <div className={styles.reportFeedPreview}>
              <ReportFeedPreview
                key={`${item.reportId}:${item.status}`}
                reportId={item.reportId}
                commentId={item.targetCommentId}
                replyId={item.targetReplyId}
              />
            </div>
          </aside>
        ) : null}
      </div>
      <div className={styles.detailActions}>
        <div className={styles.actionRow}>
          <Link href="/admin/reports" className={styles.backButton}>
            목록
          </Link>
          <ReportStatusControl item={item} onChange={setItem} />
        </div>
      </div>
    </div>
  );
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
