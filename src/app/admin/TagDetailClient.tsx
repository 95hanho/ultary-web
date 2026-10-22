'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

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
    return <PageLoadError />;
  }

  return <TagRequestDetail item={item} listHref="/admin/tags" onChange={setItem} />;
}
