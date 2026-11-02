'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { readPendingFeedEditReturn, restoreFeedEditScroll } from '@/lib/feed/edit-return';

export function FeedEditReturnRestorer() {
  const pathname = usePathname();
  useEffect(() => {
    const saved = readPendingFeedEditReturn();
    if (saved) return restoreFeedEditScroll(saved);
  }, [pathname]);
  return null;
}
