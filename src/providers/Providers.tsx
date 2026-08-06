'use client';

import { EmotionRegistry } from '@/providers/EmotionRegistry';
import { QueryProvider } from '@/providers/QueryProvider';
import type { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};

/** client 전역 Provider 묶음 (Emotion + React Query) */
export function Providers({ children }: ProvidersProps) {
  return (
    <EmotionRegistry>
      <QueryProvider>{children}</QueryProvider>
    </EmotionRegistry>
  );
}
