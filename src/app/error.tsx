'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './error.module.scss';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** 브랜드 공통 에러 경계 */
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        <h1 className={styles.title}>잠시 문제가 생겼어요</h1>
        <p className={styles.desc}>
          페이지를 다시 불러오거나 홈으로 이동해 주세요.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.retry} onClick={reset}>
            다시 시도
          </button>
          <Link href="/" className={styles.home}>
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
