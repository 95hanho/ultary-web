'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { httpErrorStatus } from '@/lib/api/error';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import type { BffEnvelope } from '@/types/api';
import { formatWhen, TARGET_TYPE } from './adminData';
import { AI_FEATURE, AI_STATUS, aiDuration, type AiLogPage } from './aiLogData';
import { Pager, useFitCount } from './adminListUi';
import styles from './admin.module.scss';
import AiReviewControl from './AiReviewControl';

export default function AiLogListClient() {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState('');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<(number | null)[]>([null]);
  const [refresh, setRefresh] = useState(0);
  const [loaded, setLoaded] = useState<{
    key: string;
    data: AiLogPage | null;
    error: boolean;
    status?: number;
  } | null>(null);
  const pageSize = useFitCount(listRef, loaded?.data?.items.length ?? 0);
  const [fit, setFit] = useState(pageSize);

  if (fit !== pageSize) {
    setFit(pageSize);
    setPage(0);
    setCursors([null]);
  }

  const cursor = cursors[page];
  const query = `status=FAILED&${filters}&targetType=${targetType}&limit=${pageSize}${cursor != null ? `&cursorAiRequestId=${cursor}` : ''}`;
  const key = `${query}:${refresh}`;
  const pending = loaded?.key !== key;
  const data = pending ? null : loaded?.data;
  const error = !pending && loaded?.error;

  useEffect(() => {
    let cancelled = false;
    bffGet<BffEnvelope<AiLogPage>>(`${bffEndpoints.admin.aiLogs}?${query}`)
      .then((response) => {
        if (!response.data) throw new Error('Missing AI log page');
        if (!cancelled) setLoaded({ key, data: response.data, error: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoaded({ key, data: null, error: true, status: httpErrorStatus(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [query, key]);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const [name, value] of values) {
      const text = String(value).trim();
      if (text) next.set(name, text);
    }
    setFilters(next.toString());
    setPage(0);
    setCursors([null]);
    setRefresh((value) => value + 1);
  };

  return (
    <section className={styles.paneFull}>
      <h1 className={styles.paneTitle}>AI 오류 로그</h1>
      <form className={styles.aiFilters} onSubmit={search}>
        <label>
          오류 코드
          <input
            name="errorCode"
            placeholder="GEMINI_TIMEOUT"
            pattern="[A-Z0-9_]{1,64}"
            maxLength={64}
          />
        </label>
        <label>
          대상 휴대폰 번호
          <input name="phone" type="tel" placeholder="01012345678" maxLength={24} />
        </label>
        <label>
          이메일
          <input name="email" type="email" placeholder="이메일 주소" maxLength={254} />
        </label>
        <button type="submit" className={styles.pageButton}>
          조회
        </button>
        <button
          type="button"
          className={styles.pageButton}
          onClick={() => setRefresh((value) => value + 1)}
          disabled={pending}
        >
          새로고침
        </button>
      </form>
      <div className={styles.aiListToolbar}>
        <p className={styles.aiHint}>실패가 발생한 요청을 작업별로 표시합니다. 전체 시도 내역은 상세에서 확인할 수 있습니다.</p>
        <select className={styles.statusSelect} aria-label="AI 로그 대상 필터" value={targetType}
          onChange={(event) => {
            setTargetType(event.target.value);
            setPage(0);
            setCursors([null]);
          }}>
          <option value="">전체</option>
          <option value="HASHTAG">태그 추천</option>
          <option value="FEED">게시글</option>
          <option value="COMMENT">댓글</option>
          <option value="REPLY">답글</option>
        </select>
      </div>
      <div ref={listRef} className={styles.listWrap + ' ' + styles.tableWrap} aria-busy={pending}>
        {pending ? (
          <p className={styles.empty} role="status">
            불러오는 중
          </p>
        ) : null}
        {error ? <PageLoadError status={loaded?.status} /> : null}
        {data?.items.length === 0 ? (
          <p className={styles.empty}>조건에 맞는 AI 로그가 없습니다.</p>
        ) : null}
        <table className={styles.dataTable + ' ' + styles.aiTable}>
          <caption className={styles.tableCaption}>AI 오류 로그 목록</caption>
          <colgroup>
            <col className={styles.numberColumn} /><col /><col /><col className={styles.memberColumn} />
            <col className={styles.attemptColumn} /><col className={styles.dateColumn} />
            <col className={styles.dateColumn} /><col className={styles.resultColumn} />
            <col className={styles.actionColumn} />
          </colgroup>
          <thead><tr>
            <th scope="col">번호</th><th scope="col">기능 · 대상</th><th scope="col">오류 · 검사 내용</th>
            <th scope="col">회원(no)</th><th scope="col">시도 · 소요</th>
            <th scope="col">발생날짜</th><th scope="col">처리날짜</th>
            <th scope="col">호출결과</th><th scope="col">상태변경</th>
          </tr></thead>
          <tbody>
            {data?.items.map((item, index) => (
              <tr key={item.aiRequestId}
                className={[styles.rowClickable,
                  item.adminReviewStatus === 'KEPT' || item.adminReviewStatus === 'DELETED' ? styles.settled : '',
                ].filter(Boolean).join(' ')}
                onClick={(event) => {
                  if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('a'))) return;
                  router.push('/admin/ai/logs/' + item.aiRequestId);
                }}>
                <td className={styles.tableNumber}>{(data?.totalCount ?? 0) - page * pageSize - index}</td>
                <td>
                  <Link href={'/admin/ai/logs/' + item.aiRequestId} className={styles.tableLink}>
                    <span className={styles.tableText}>{AI_FEATURE[item.featureType] ?? item.featureType}</span>
                  </Link>
                  <span className={styles.tableMuted}>
                    {item.targetType ? (TARGET_TYPE[item.targetType] ?? item.targetType) + (item.targetId != null ? ' #' + item.targetId : '') : '–'}
                  </span>
                </td>
                <td>
                  <Link href={'/admin/ai/logs/' + item.aiRequestId} className={styles.tableLink}>
                    <span className={styles.tableText} title={item.errorCode ?? undefined}>
                      {item.errorCode ?? AI_STATUS[item.status] ?? item.status}
                    </span>
                  </Link>
                  <span className={styles.tableText} title={item.inspectionContent ?? undefined}>
                    {item.inspectionContent ?? '내용 기록 없음'}
                  </span>
                </td>
                <td>{item.userNo ?? '–'}</td>
                <td>
                  <span className={styles.tableText}>총 {item.attemptCount ?? 1}회</span>
                  <span className={styles.tableMuted}>{aiDuration(item.latencyMs)}</span>
                </td>
                <td className={styles.tableDate}>{item.createdAt ? formatWhen(item.createdAt) : '–'}</td>
                <td className={styles.tableDate}>{item.adminReviewedAt ? formatWhen(item.adminReviewedAt) : '–'}</td>
                <td>
                  <span className={styles.badge + ' ' + (item.status === 'FAILED' ? styles.toneNo : styles.toneOk)}>
                    {AI_STATUS[item.status] ?? item.status}
                  </span>
                </td>
                <td className={styles.tableActions} onClick={(event) => event.stopPropagation()}>
                  {item.status === 'FAILED' && item.moderationJobId != null ? (
                    <AiReviewControl item={item} onChange={() => {
                      setPage(0);
                      setCursors([null]);
                      setRefresh((value) => value + 1);
                    }} />
                  ) : <span className={styles.tableMuted}>조치 대상 없음</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager
        page={page}
        totalCount={data?.totalCount ?? null}
        pageSize={pageSize}
        hasNext={data?.nextCursorAiRequestId != null}
        disabled={pending || !!error}
        onPrev={() => setPage((value) => Math.max(0, value - 1))}
        onNext={() => {
          const next = data?.nextCursorAiRequestId;
          if (next == null) return;
          setCursors((values) => [...values.slice(0, page + 1), next]);
          setPage((value) => value + 1);
        }}
      />
    </section>
  );
}
