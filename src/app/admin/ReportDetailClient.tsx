'use client';

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

export default function ReportDetailClient({ reportId }: { reportId: number }) {
  const [item, setItem] = useState<ReportItem | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await findReport(reportId);
        if (cancelled) return;
        setItem(found);
        setState(found ? 'ready' : 'missing');
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
    return (
      <section className={styles.paneFull}>
        <p className={styles.empty}>
          {state === 'error' ? '신고를 불러오지 못했습니다.' : '신고를 찾지 못했습니다.'}
        </p>
        <Link href="/admin/reports" className={styles.backLink}>
          목록
        </Link>
      </section>
    );
  }

  const typeLabel = TARGET_TYPE[item.targetType] ?? item.targetType;
  const reasonLabel = REPORT_REASON[item.reason] ?? item.reason;

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
