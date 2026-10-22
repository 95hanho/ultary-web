'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import { MediaImage } from '@/components/common/MediaImage';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  TAG_STATUS,
  fetchTagTotalCount,
  formatWhen,
  loadTagPage,
  memberLabel,
  sameTagOrigin,
  type TagOrigin,
} from './adminData';
import { Pager, badgeClass, useFitCount } from './adminListUi';
import styles from './admin.module.scss';
import type { TagRequest } from './TagRequestDetail';

export default function TagListClient() {
  const listRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<TagRequest[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
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
      if (existing && sameTagOrigin(existing, target)) return prev;
      return [...prev.slice(0, page + 1), target];
    });
    setPage((current) => current + 1);
  };

  return (
    <section className={styles.paneFull}>
      <h1 className={styles.paneTitle}>태그요청</h1>
      {state === 'loading' && tags.length === 0 ? <p className={styles.empty}>불러오는 중</p> : null}
      {state === 'error' ? <PageLoadError /> : null}
      {state === 'ready' && tags.length === 0 ? <p className={styles.empty}>요청이 없습니다.</p> : null}
      <div ref={listRef} className={styles.listWrap}>
        <ul className={styles.list}>
          {tags.map((item) => (
            <li key={item.requestId}>
              <Link
                href={`/admin/tags/${item.requestId}`}
                className={item.status === 'APPROVED' ? `${styles.row} ${styles.settled}` : styles.row}
              >
                <span className={styles.rowMain}>
                  <span className={styles.rowLead}>
                    {item.tagId != null ? <span className={styles.rowId}>{item.tagId}</span> : null}
                    {item.imageUrls[0] ? (
                      <span className={styles.thumb}>
                        <MediaImage src={item.imageUrls[0]} alt="" width={60} height={60} className={styles.thumbImg} />
                      </span>
                    ) : null}
                    <span className={styles.rowBody}>
                      <span className={styles.rowName}>#{item.hashtag}</span>
                      {item.title ? <span className={styles.rowMeta}>{item.title}</span> : null}
                      {item.requesterUserNo != null ? (
                        <span className={styles.rowMeta}>{memberLabel(item.requesterUserNo, item.requesterNickname)}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className={styles.rowSide}>
                    <span className={badgeClass(item.status)}>{TAG_STATUS[item.status] ?? item.status}</span>
                    {item.createdAt ? <span className={styles.rowWhen}>{formatWhen(item.createdAt)}</span> : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
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
