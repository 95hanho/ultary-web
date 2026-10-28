'use client';

import { nicknameTag } from '@/lib/nickname-tag';
import { PageLoadError } from '@/components/common/PageLoadError';
import { httpErrorStatus } from '@/lib/api/error';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { formatWhen, loadReportPage, REPORT_REASON, TARGET_TYPE, type ReportItem, type ReportOrigin } from './adminData';
import { Pager, badgeClass, useFitCount } from './adminListUi';
import styles from './admin.module.scss';
import ReportStatusControl from './ReportStatusControl';

export default function ReportListClient() {
  const router = useRouter();
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
      <div ref={listRef} className={styles.listWrap + ' ' + styles.tableWrap}>
        <table className={styles.dataTable + ' ' + styles.reportTable}>
          <caption className={styles.tableCaption}>신고 목록</caption>
          <colgroup>
            <col className={styles.numberColumn} /><col /><col /><col className={styles.reportTargetColumn} />
            <col className={styles.reportMemberColumn} /><col className={styles.reportMemberColumn} />
            <col className={styles.dateColumn} /><col className={styles.dateColumn} />
            <col className={styles.actionColumn} />
          </colgroup>
          <thead><tr>
            <th scope="col">번호</th><th scope="col">신고종류</th><th scope="col">신고유형</th>
            <th scope="col">내용</th><th scope="col">대상 회원</th><th scope="col">신고 회원</th><th scope="col">신고날짜</th>
            <th scope="col">처리날짜</th><th scope="col">상태변경</th>
          </tr></thead>
          <tbody>
            {reports.map((item, index) => {
              const blocked = item.targetSuspended && item.targetType !== 'USER';
              const target = item.targetType === 'USER'
                ? '–'
                : item.targetContent || item.detail || '내용 없음';
              return (
                <tr key={item.reportId} className={[
                  !blocked ? styles.rowClickable : '',
                  blocked || (item.status !== 'REQUESTED' && item.status !== 'CONFIRMED') ? styles.settled : '',
                  blocked ? styles.rowBlocked : '',
                ].filter(Boolean).join(' ')}
                  onClick={(event) => {
                    if (blocked || event.defaultPrevented || (event.target instanceof Element && event.target.closest('a'))) return;
                    router.push('/admin/reports/' + item.reportId);
                  }}
                >
                  <td className={styles.tableNumber}>{total != null ? total - page * pageSize - index : '–'}</td>
                  <td>{TARGET_TYPE[item.targetType] ?? item.targetType}</td>
                  <td>{REPORT_REASON[item.reason] ?? item.reason}</td>
                  <td>
                    <span className={styles.tablePreview} title={target}>
                      {Array.from(target).slice(0, 30).join('') + (Array.from(target).length > 30 ? '...' : '')}
                    </span>
                    {item.targetSuspended ? <span className={styles.tableMuted + ' ' + styles.suspendedMember}>정지된 회원</span> : null}
                  </td>
                  <td>
                    <span className={styles.tableText} title={nicknameTag(item.targetNickname)}>
                      {item.targetUserNo != null ? (item.targetNickname ? nicknameTag(item.targetNickname) : '알 수 없는 사용자') + '(' + item.targetUserNo + ')' : '–'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.tableText} title={nicknameTag(item.reporterNickname)}>
                      {item.reporterUserNo != null ? (item.reporterNickname ? nicknameTag(item.reporterNickname) : '알 수 없는 사용자') + '(' + item.reporterUserNo + ')' : '–'}
                    </span>
                  </td>
                  <td className={styles.tableDate}>{item.createdAt ? formatWhen(item.createdAt) : '–'}</td>
                  <td className={styles.tableDate}>{item.processedAt ? formatWhen(item.processedAt) : '–'}</td>
                  <td className={styles.tableActions} onClick={(event) => event.stopPropagation()}>
                    {blocked ? (
                      <span className={badgeClass('SUSPENDED') + ' ' + styles.suspendedMember}>정지된 회원</span>
                    ) : (
                      <ReportStatusControl item={item} onChange={(next) =>
                        setReports((values) => values.map((value) => {
                          if (value.reportId === next.reportId) return next;
                          return value.targetUserNo === next.targetUserNo
                            ? { ...value, targetSuspended: next.targetSuspended } : value;
                        }))
                      } />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
