'use client';

import { ModalHost } from '@/components/common/Modal';
import { DevTestProvider } from '@/components/dev/DevTestProvider';
import { EmotionRegistry } from '@/providers/EmotionRegistry';
import { QueryProvider } from '@/providers/QueryProvider';
import type { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};

/** client 전역 Provider 묶음 (Emotion + React Query + Modal) */
export function Providers({ children }: ProvidersProps) {
  return (
    <EmotionRegistry>
      <QueryProvider>
        <DevTestProvider>
          {children}
          <ModalHost />
        </DevTestProvider>
      </QueryProvider>
    </EmotionRegistry>
  );
}
