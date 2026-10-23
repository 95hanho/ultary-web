'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';

type SettingsReturnState = { scrollTop: number; href: string; appInfoOpen: boolean };
let returnState: SettingsReturnState | null = null;
let returnedByHistory = false;

export function saveSettingsReturnState(state: SettingsReturnState | null) {
  returnState = state;
  returnedByHistory = false;
}

export function readSettingsReturnState() {
  return returnedByHistory ? returnState : null;
}

export function takeSettingsReturnState() {
  const saved = readSettingsReturnState();
  saveSettingsReturnState(null);
  return saved;
}

/** 설정 레이아웃에 유지되며, 하위 항목에서 방문 기록으로 돌아온 경우만 복원한다. */
export function SettingsReturnTracker() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useLayoutEffect(() => {
    const onPopState = () => {
      const from = pathnameRef.current;
      returnedByHistory = Boolean(
        returnState &&
        (from === returnState.href || from.startsWith(`${returnState.href}/`)) &&
        window.location.pathname === '/settings',
      );
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      saveSettingsReturnState(null);
    };
  }, []);

  useLayoutEffect(() => {
    pathnameRef.current = pathname;
    if (returnState && pathname !== '/settings' &&
        pathname !== returnState.href && !pathname.startsWith(`${returnState.href}/`)) {
      saveSettingsReturnState(null);
    }
  }, [pathname]);

  return null;
}
