'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import Link from 'next/link';
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
  const listRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState('status=FAILED&targetType=MODERATION');
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
  const query = `${filters}&limit=${pageSize}${cursor != null ? `&cursorAiRequestId=${cursor}` : ''}`;
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
          호출 결과
          <select name="status" defaultValue="FAILED">
            <option value="FAILED">실패</option>
            <option value="ALL">전체</option>
            <option value="SUCCESS">성공</option>
            <option value="PENDING">대기</option>
          </select>
        </label>
        <label>
          기능
          <select name="featureType">
            <option value="">전체</option>
            {Object.entries(AI_FEATURE).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          대상
          <select name="targetType" defaultValue="MODERATION">
            <option value="MODERATION">게시글·댓글·답글</option>
            <option value="">전체</option>
            {['FEED', 'COMMENT', 'REPLY'].map((value) => (
              <option key={value} value={value}>
                {TARGET_TYPE[value]}
              </option>
            ))}
          </select>
        </label>
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
          대상 ID
          <input name="targetId" type="number" min="1" step="1" />
        </label>
        <label>
          회원 번호
          <input name="userNo" type="number" min="1" step="1" />
        </label>
        <label>
          작업 ID
          <input name="moderationJobId" type="number" min="1" step="1" />
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
      <p className={styles.aiHint}>
        호출 시도별 기록입니다. 실패 이후 재시도 결과는 상세에서 확인할 수 있습니다.
      </p>
      <div ref={listRef} className={styles.listWrap} aria-busy={pending}>
        {pending ? (
          <p className={styles.empty} role="status">
            불러오는 중
          </p>
        ) : null}
        {error ? <PageLoadError status={loaded?.status} /> : null}
        {data?.items.length === 0 ? (
          <p className={styles.empty}>조건에 맞는 AI 로그가 없습니다.</p>
        ) : null}
        <ul className={styles.list}>
          {data?.items.map((item) => (
            <li key={item.aiRequestId}>
              <div
                className={`${styles.row} ${item.adminReviewStatus === 'KEPT' || item.adminReviewStatus === 'DELETED' ? styles.settled : ''}`}
              >
                <span className={`${styles.rowMain} ${styles.aiRowMain}`}>
                  <Link
                    href={`/admin/ai/logs/${item.aiRequestId}`}
                    className={`${styles.rowLead} ${styles.rowLink}`}
                  >
                    <span className={styles.rowId}>{item.aiRequestId}</span>
                    <span className={styles.rowBody}>
                      <span className={`${styles.rowName} ${styles.aiCode}`}>
                        {item.errorCode ?? AI_STATUS[item.status] ?? item.status}
                      </span>
                      <span className={styles.rowMeta}>
                        {AI_FEATURE[item.featureType] ?? item.featureType}
                        {item.targetType
                          ? ` · ${TARGET_TYPE[item.targetType] ?? item.targetType} #${item.targetId}`
                          : ''}
                      </span>
                      <span className={styles.rowMeta}>
                        {aiDuration(item.latencyMs)}
                        {item.attemptNo != null ? ` · ${item.attemptNo}번째 시도` : ''}
                        {item.jobStatus
                          ? ` · 현재 ${AI_STATUS[item.jobStatus] ?? item.jobStatus}`
                          : ''}
                      </span>
                      {item.targetType && ['FEED', 'COMMENT', 'REPLY'].includes(item.targetType) ? (
                        <span className={styles.aiContent}>
                          {item.inspectionContent ?? '내용 기록 없음'}
                        </span>
                      ) : null}
                      {item.adminReviewStatus ? (
                        <span className={styles.rowMeta}>
                          관리자:{' '}
                          {{ PENDING: '확인 대기', KEPT: '유지', DELETED: '삭제조치' }[
                            item.adminReviewStatus
                          ] ?? item.adminReviewStatus}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                  <span className={styles.rowSide}>
                    {item.status === 'FAILED' && item.moderationJobId != null ? (
                      <AiReviewControl
                        item={item}
                        onChange={(next) =>
                          setLoaded((current) =>
                            current?.data
                              ? {
                                  ...current,
                                  data: {
                                    ...current.data,
                                    items: current.data.items.map((value) =>
                                      value.moderationJobId === next.moderationJobId
                                        ? {
                                            ...value,
                                            adminReviewStatus: next.adminReviewStatus,
                                            jobStatus: next.jobStatus,
                                          }
                                        : value,
                                    ),
                                  },
                                }
                              : current,
                          )
                        }
                      />
                    ) : null}
                    <span
                      className={`${styles.badge} ${item.status === 'FAILED' ? styles.toneNo : styles.toneOk}`}
                    >
                      {AI_STATUS[item.status] ?? item.status}
                    </span>
                    <span className={styles.rowWhen}>
                      {item.createdAt ? formatWhen(item.createdAt) : '기록 없음'}
                    </span>
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
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
