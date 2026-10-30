'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { PageLoadError } from '@/components/common/PageLoadError';
import { bffEndpoints } from '@/lib/api/endpoints';
import { Pager, useFitCount } from './adminListUi';
import { formatWhen } from './adminData';
import {
  ACTION_KIND,
  ACTION_NAME,
  ACTION_STATUS,
  actionHref,
  type AdminAction,
} from './adminManagementData';
import { useAdminPage } from './useAdminPage';
import styles from './admin.module.scss';

export default function ActionLogListClient() {
  const list = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState({ q: '', targetType: 'ALL', page: 0 });
  const [count, setCount] = useState(0);
  const size = useFitCount(list, count);
  const [fit, setFit] = useState(size);
  if (fit !== size) {
    setFit(size);
    setFilter((f) => ({ ...f, page: 0 }));
  }
  const { data, error, loading, reload } = useAdminPage<AdminAction>(bffEndpoints.admin.actions, {
    ...filter,
    size,
  });
  if (data && count !== data.items.length) setCount(data.items.length);
  return (
    <section className={styles.paneFull}>
      <h1 className={styles.paneTitle}>관리자 처리 이력</h1>
      <form
        className={styles.aiFilters}
        onSubmit={(e) => {
          e.preventDefault();
          setFilter((f) => ({ ...f, q: q.trim(), page: 0 }));
        }}
      >
        <label>
          관리자 · 처리 대상
          <input
            className={styles.memberSearch}
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            placeholder="관리자, 닉네임태그, 태그명, 번호"
          />
        </label>
        <label>
          대상
          <select
            value={filter.targetType}
            onChange={(e) => setFilter((f) => ({ ...f, targetType: e.target.value, page: 0 }))}
          >
            <option value="ALL">전체</option>
            {Object.entries(ACTION_KIND).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={styles.pageButton}>
          검색
        </button>
        <button type="button" className={styles.pageButton} onClick={reload}>
          새로고침
        </button>
      </form>
      <p className={styles.aiHint}>
        ‘예시 이력’은 기존 처리일을 기준으로 구성한 시연 데이터입니다. 새 조치는 실제 처리 이력으로
        저장합니다.
      </p>
      {error ? <PageLoadError error={error.value} /> : null}
      <div ref={list} className={`${styles.listWrap} ${styles.tableWrap}`} aria-busy={loading}>
        <table className={styles.dataTable}>
          <caption className={styles.tableCaption}>관리자 처리 이력 목록</caption>
          <thead>
            <tr>
              {[
                '번호',
                '처리일시',
                '관리자',
                '처리 내용',
                '대상',
                '변경 전',
                '변경 후',
                '사유',
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.actionLogId}>
                <td>{item.actionLogId}</td>
                <td className={styles.tableDate}>{formatWhen(item.createdAt)}</td>
                <td>
                  {item.adminName || item.adminLoginId}
                  <br />
                  <span className={styles.tableMuted}>
                    {item.adminLoginId} ({item.adminNo})
                  </span>
                </td>
                <td>
                  {ACTION_NAME[item.action] ?? item.action}
                  {item.sample ? <small className={styles.sampleHistory}>예시 이력</small> : null}
                </td>
                <td>
                  <Link className={styles.memberLink} href={actionHref(item)}>
                    {item.targetLabel || `${ACTION_KIND[item.targetType]} #${item.targetId}`}
                  </Link>
                  {item.requestId ? (
                    <small className={styles.metaBlock}>요청 #{item.requestId}</small>
                  ) : null}
                </td>
                <td>
                  {item.beforeStatus
                    ? (ACTION_STATUS[item.beforeStatus] ?? item.beforeStatus)
                    : '–'}
                </td>
                <td>
                  {item.afterStatus ? (ACTION_STATUS[item.afterStatus] ?? item.afterStatus) : '–'}
                </td>
                <td className={styles.auditReason}>{item.reason || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? (
          <p className={styles.empty}>불러오는 중</p>
        ) : !error && !data?.items.length ? (
          <p className={styles.empty}>처리 이력이 없습니다.</p>
        ) : null}
      </div>
      <Pager
        page={filter.page}
        pageSize={size}
        totalCount={data?.totalCount ?? null}
        disabled={loading}
        hasNext={!!data && (filter.page + 1) * size < data.totalCount}
        onPrev={() => setFilter((f) => ({ ...f, page: Math.max(0, f.page - 1) }))}
        onNext={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
      />
    </section>
  );
}
