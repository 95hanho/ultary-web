'use client';

import { PageLoadError } from '@/components/common/PageLoadError';
import { httpErrorStatus } from '@/lib/api/error';

import { MediaImage } from '@/components/common/MediaImage';
import { useEffect, useRef, useState } from 'react';
import {
  fetchTagTotalCount,
  formatWhen,
  loadTagPage,
  sameTagOrigin,
  type TagOrigin,
} from './adminData';
import { Pager, useFitCount } from './adminListUi';
import styles from './admin.module.scss';
import TagStatusControl from './TagStatusControl';
import type { TagRequest } from './tagRequestData';

export default function TagListClient() {
  const listRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<TagRequest[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [failureStatus, setFailureStatus] = useState(500);
  const [page, setPage] = useState(0);
  const [origins, setOrigins] = useState<TagOrigin[]>([{ mode: 'pending' }]);
  const [next, setNext] = useState<TagOrigin | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const pageSize = useFitCount(listRef, tags.length);
  const [fit, setFit] = useState(pageSize);

  if (fit !== pageSize) {
    setFit(pageSize);
    setPage(0);
    setOrigins([{ mode: 'pending' }]);
  }

  useEffect(() => {
    let cancelled = false;
    const origin = origins[page] ?? { mode: 'pending' as const };
    (async () => {
      try {
        const [loaded, totalCount] = await Promise.all([
          loadTagPage(origin, pageSize),
          fetchTagTotalCount(),
        ]);
        if (cancelled) return;
        setTags(loaded.items);
        setNext(loaded.next);
        setTotal(totalCount);
        setState('ready');
      } catch (err) {
        console.error('[admin] tag requests', err);
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
      if (existing && sameTagOrigin(existing, target)) return prev;
      return [...prev.slice(0, page + 1), target];
    });
    setPage((current) => current + 1);
  };

  return (
    <section className={styles.paneFull}>
      <h1 className={styles.paneTitle}>태그요청</h1>
      {state === 'loading' && tags.length === 0 ? (
        <p className={styles.empty}>불러오는 중</p>
      ) : null}
      {state === 'error' ? <PageLoadError status={failureStatus} /> : null}
      {state === 'ready' && tags.length === 0 ? (
        <p className={styles.empty}>요청이 없습니다.</p>
      ) : null}
      <div ref={listRef} className={styles.listWrap + ' ' + styles.tableWrap}>
        <table className={styles.dataTable}>
          <caption className={styles.tableCaption}>태그요청 목록</caption>
          <colgroup>
            <col className={styles.numberColumn} /><col className={styles.imageColumn} />
            <col /><col /><col /><col className={styles.linkColumn} /><col /><col className={styles.dateColumn} />
            <col className={styles.dateColumn} /><col className={styles.actionColumn} />
          </colgroup>
          <thead><tr>
            <th scope="col">번호</th><th scope="col">이미지</th><th scope="col">태그명</th>
            <th scope="col">태그title</th><th scope="col">태그설명</th><th scope="col">링크(도메인명)</th><th scope="col">닉네임(no)</th>
            <th scope="col">요청날짜</th><th scope="col">확인날짜</th><th scope="col">상태변경</th>
          </tr></thead>
          <tbody>
            {tags.map((item, index) => {
              const domain = linkDomain(item.link);
              return (
              <tr
                key={item.requestId}
                className={item.status === 'APPROVED' ? styles.settled : item.status === 'REJECTED' ? styles.tagRejected : undefined}
              >
                <td className={styles.tableNumber}>{total != null ? total - page * pageSize - index : '–'}</td>
                <td>
                  {item.imageUrls[0] ? (
                    <span className={styles.tableThumb}>
                      <MediaImage src={item.imageUrls[0]} alt="" width={48} height={48} className={styles.thumbImg} />
                    </span>
                  ) : <span className={styles.tableMuted}>없음</span>}
                </td>
                <td>
                  <strong className={styles.tableText} title={'#' + item.hashtag}>#{item.hashtag}</strong>
                </td>
                <td title={item.title}>
                  {item.title ? Array.from(item.title).slice(0, 15).join('') + (Array.from(item.title).length > 15 ? '...' : '') : '–'}
                </td>
                <td title={item.content}>
                  {item.content ? Array.from(item.content).slice(0, 15).join('') + (Array.from(item.content).length > 15 ? '...' : '') : '–'}
                </td>
                <td>
                  {domain ? (
                    <a href={item.link} title={item.link} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
                      {domain}
                    </a>
                  ) : '–'}
                </td>
                <td><span className={styles.tableText} title={item.requesterNickname ?? undefined}>
                  {item.requesterUserNo != null ? (item.requesterNickname || '알 수 없는 사용자') + '(' + item.requesterUserNo + ')' : '–'}
                </span></td>
                <td className={styles.tableDate}>{item.createdAt ? formatWhen(item.createdAt) : '–'}</td>
                <td className={styles.tableDate}>{item.reviewedAt ? formatWhen(item.reviewedAt) : '–'}</td>
                <td className={styles.tableActions}>
                  <TagStatusControl item={item} onChange={(next) =>
                    setTags((values) => values.map((value) => value.requestId === next.requestId ? next : value))
                  } />
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

function linkDomain(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}
