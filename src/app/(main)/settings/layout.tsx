import type { ReactNode } from 'react';
import { SettingsReturnTracker } from './SettingsReturnTracker';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SettingsReturnTracker />
      {children}
    </>
  );
}
