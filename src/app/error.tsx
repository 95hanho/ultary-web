'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import { useEffect } from 'react';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** 브랜드 공통 에러 경계 */
export default function GlobalError({ error }: ErrorProps) {
  useEffect(() => {
    console.error('[app-error]', error);
  }, [error]);

  return <PageLoadError error={error} />;
}
