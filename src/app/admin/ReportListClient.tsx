'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { REPORT_STATUS, formatWhen, loadReportPage, type ReportItem, type ReportOrigin } from './adminData';
import { Pager, badgeClass, useFitCount } from './adminListUi';
import styles from './admin.module.scss';

export default function ReportListClient() {
  const listRef = useRef<HTMLDivElement>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [page, setPage] = useState(0);
  const [origins, setOrigins] = useState<ReportOrigin[]>([{}]);
  const [next, setNext] = useState<ReportOrigin | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const pageSize = useFitCount(listRef, reports.length);
  const [fit, setFit] = useState(pageSize);

  if (fit !== pageSize) {
    setFit(pageSize);
    setPage(0);
    setOrigins([{}]);
  }

  useEffect(() => {
    let cancelled = false;
    const origin = origins[page] ?? {};
    (async () => {
      try {
        const loaded = await loadReportPage(origin, pageSize);
        if (cancelled) return;
        setReports(loaded.items);
        setNext(loaded.next);
        setTotal(loaded.totalCount);
        setState('ready');
      } catch (err) {
        console.error('[admin] reports', err);
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, origins, pageSize]);

  const goNext = () => {
    if (!next) return;
    const target = next;
    setOrigins((prev) => {
      const existing = prev[page + 1];
      if (existing && existing.cursor === target.cursor) return prev;
      return [...prev.slice(0, page + 1), target];
    });
    setPage((current) => current + 1);
  };

  return (
    <section className={styles.paneFull}>
      <h1 className={styles.paneTitle}>신고목록</h1>
      {state === 'loading' && reports.length === 0 ? <p className={styles.empty}>불러오는 중</p> : null}
      {state === 'error' ? <PageLoadError /> : null}
      {state === 'ready' && reports.length === 0 ? <p className={styles.empty}>신고가 없습니다.</p> : null}
      <div ref={listRef} className={styles.listWrap}>
        <ul className={styles.list}>
          {reports.map((item) => {
            const blocked = item.targetSuspended && item.targetType !== 'USER';
            const rowClass = [
              styles.row,
              blocked || (item.status !== 'REQUESTED' && item.status !== 'CONFIRMED') ? styles.settled : '',
              blocked ? styles.rowBlocked : '',
            ]
              .filter(Boolean)
              .join(' ');
            const body = (
              <span className={styles.rowMain}>
                <span className={styles.rowLead}>
                  <span className={styles.rowId}>{item.reportId}</span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowMeta}>{item.headline}</span>
                    {item.detail ? <span className={styles.rowName}>{item.detail}</span> : null}
                    {item.targetSuspended ? (
                      <span className={styles.rowSuspended}>* 정지된 회원입니다</span>
                    ) : null}
                  </span>
                </span>
                <span className={styles.rowSide}>
                  <span className={`${badgeClass(blocked ? 'SUSPENDED' : item.status)} ${styles.badgeReport}`}>
                    {blocked ? '정지된 회원' : (REPORT_STATUS[item.status] ?? item.status)}
                  </span>
                  {item.createdAt ? <span className={styles.rowWhen}>{formatWhen(item.createdAt)}</span> : null}
                </span>
              </span>
            );
            return (
              <li key={item.reportId}>
                {blocked ? (
                  <div className={rowClass} aria-disabled="true">
                    {body}
                  </div>
                ) : (
                  <Link href={`/admin/reports/${item.reportId}`} className={rowClass}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <Pager
        page={page}
        totalCount={total}
        pageSize={pageSize}
        hasNext={next != null}
        disabled={state === 'loading'}
        onPrev={() => setPage((current) => Math.max(0, current - 1))}
        onNext={goNext}
      />
    </section>
  );
}
