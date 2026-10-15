'use client';

import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import { useEffect, useState } from 'react';

export type MenuCounts = {
  pendingTagRequestCount: number;
  requestedReportCount: number;
};

export function useMenuCounts(refreshKey = '') {
  const [counts, setCounts] = useState<MenuCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    bffGet<BffEnvelope<unknown>>(bffEndpoints.admin.menuCounts)
      .then((res) => {
        if (cancelled) return;
        setCounts(readMenuCounts(res.data));
      })
      .catch((err) => {
        console.error('[admin] menu counts', err);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return counts;
}

export function withCount(label: string, count: number | null | undefined) {
  return count == null ? label : `${label} (${count})`;
}

function readMenuCounts(raw: unknown): MenuCounts | null {
  if (!isRecord(raw)) return null;
  const pendingTagRequestCount = readCount(raw.pendingTagRequestCount);
  const requestedReportCount = readCount(raw.requestedReportCount);
  if (pendingTagRequestCount == null || requestedReportCount == null) return null;
  return { pendingTagRequestCount, requestedReportCount };
}

function readCount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.trunc(value);
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}
