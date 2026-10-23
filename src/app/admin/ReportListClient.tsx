'use client';

import { PageLoadError } from '@/components/common/PageLoadError';
import { httpErrorStatus } from '@/lib/api/error';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatWhen, loadReportPage, type ReportItem, type ReportOrigin } from './adminData';
import { Pager, badgeClass, useFitCount } from './adminListUi';
import styles from './admin.module.scss';
import ReportStatusControl from './ReportStatusControl';

export default function ReportListClient() {
  const listRef = useRef<HTMLDivElement>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [failureStatus, setFailureStatus] = useState(500);
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
        if (!cancelled) {
          setFailureStatus(httpErrorStatus(err));
          setState('error');
        }
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
      {state === 'loading' && reports.length === 0 ? (
        <p className={styles.empty}>불러오는 중</p>
      ) : null}
      {state === 'error' ? <PageLoadError status={failureStatus} /> : null}
      {state === 'ready' && reports.length === 0 ? (
        <p className={styles.empty}>신고가 없습니다.</p>
      ) : null}
      <div ref={listRef} className={styles.listWrap}>
        <ul className={styles.list}>
          {reports.map((item) => {
            const blocked = item.targetSuspended && item.targetType !== 'USER';
            const rowClass = [
              styles.row,
              blocked || (item.status !== 'REQUESTED' && item.status !== 'CONFIRMED')
                ? styles.settled
                : '',
              blocked ? styles.rowBlocked : '',
            ]
              .filter(Boolean)
              .join(' ');
            const body = (
              <span className={styles.rowMain}>
                <Link
                  href={`/admin/reports/${item.reportId}`}
                  className={`${styles.rowLead} ${styles.rowLink}`}
                  aria-disabled={blocked}
                  onClick={(event) => {
                    if (blocked) event.preventDefault();
                  }}
                >
                  <span className={styles.rowId}>{item.reportId}</span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowMeta}>{item.headline}</span>
                    {item.detail ? <span className={styles.rowName}>{item.detail}</span> : null}
                    {item.targetSuspended ? (
                      <span className={styles.rowSuspended}>* 정지된 회원입니다</span>
                    ) : null}
                  </span>
                </Link>
                <span className={styles.rowSide}>
                  {blocked ? (
                    <span className={`${badgeClass('SUSPENDED')} ${styles.badgeReport}`}>
                      정지된 회원
                    </span>
                  ) : (
                    <ReportStatusControl
                      item={item}
                      onChange={(next) =>
                        setReports((values) =>
                          values.map((value) => {
                            if (value.reportId === next.reportId) return next;
                            return value.targetUserNo === next.targetUserNo
                              ? { ...value, targetSuspended: next.targetSuspended }
                              : value;
                          }),
                        )
                      }
                    />
                  )}

                  {item.createdAt ? (
                    <span className={styles.rowWhen}>{formatWhen(item.createdAt)}</span>
                  ) : null}
                </span>
              </span>
            );
            return (
              <li key={item.reportId}>
                <div className={rowClass}>{body}</div>
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
