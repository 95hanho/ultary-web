'use client';

import { ensureLiveSocket } from '@/lib/ws/liveSocket';
import { useEffect } from 'react';

/** 로그인된 화면에서 웹소켓을 한 번만 연다. */
export function LiveSocket() {
  useEffect(() => {
    ensureLiveSocket();
  }, []);
  return null;
}
