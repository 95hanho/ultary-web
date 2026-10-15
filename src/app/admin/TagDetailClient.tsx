'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { findTagRequest } from './adminData';
import styles from './admin.module.scss';
import TagRequestDetail, { type TagRequest } from './TagRequestDetail';

export default function TagDetailClient({ requestId }: { requestId: number }) {
  const [item, setItem] = useState<TagRequest | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await findTagRequest(requestId);
        if (cancelled) return;
        setItem(found);
        setState(found ? 'ready' : 'missing');
      } catch (err) {
        console.error('[admin] tag detail', err);
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

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
          {state === 'error' ? '태그 요청을 불러오지 못했습니다.' : '태그 요청을 찾지 못했습니다.'}
        </p>
        <Link href="/admin/tags" className={styles.backLink}>
          목록
        </Link>
      </section>
    );
  }

  return <TagRequestDetail item={item} listHref="/admin/tags" onChange={setItem} />;
}
