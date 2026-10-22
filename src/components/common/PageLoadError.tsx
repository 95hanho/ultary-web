'use client';

import { RefreshCw } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { isHttpError } from '@/lib/api/error';
import { isUnavailablePageError } from '@/lib/api/page-load-error';
import styles from './PageLoadError.module.scss';

/** 접근 불가·없는 페이지는 404, 일시적인 조회 실패는 현재 URL에서 재조회한다. */
export function PageLoadError({ error }: { error?: unknown }) {
  if (isHttpError(error) && error.status === 401) redirect('/login');
  if (isUnavailablePageError(error)) notFound();
  return (
    <section className={styles.root} role="alert">
      <p className={styles.title}>일시적인 오류가 발생했습니다.</p>
      <p className={styles.description}>페이지를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</p>
      <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
        <RefreshCw size={18} aria-hidden />
        새로고침하기
      </button>
    </section>
  );
}
