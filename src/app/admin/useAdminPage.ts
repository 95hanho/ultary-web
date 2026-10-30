'use client';
import { useEffect, useState } from 'react';
import { bffGet } from '@/lib/api/bffFetch';
import type { BffEnvelope } from '@/types/api';
import type { AdminPage } from './adminManagementData';

export function useAdminPage<T>(endpoint: string, params: Record<string, string | number>) {
  const [refresh, setRefresh] = useState(0);
  const [loaded, setLoaded] = useState<{
    key: string;
    data?: AdminPage<T>;
    error?: { value: unknown };
  } | null>(null);
  const key = JSON.stringify({ endpoint, params, refresh });
  useEffect(() => {
    let cancelled = false;
    const request = JSON.parse(key) as {
      endpoint: string;
      params: Record<string, string | number>;
    };
    bffGet<BffEnvelope<AdminPage<T>>>(request.endpoint, request.params)
      .then((response) => {
        if (!response.data) throw new Error('목록 응답이 없습니다.');
        if (!cancelled) setLoaded({ key, data: response.data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoaded({ key, error: { value: error } });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);
  const current = loaded?.key === key ? loaded : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    reload: () => setRefresh((n) => n + 1),
  };
}
