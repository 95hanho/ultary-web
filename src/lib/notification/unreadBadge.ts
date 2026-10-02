import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';

let cached: number | null = null;
const listeners = new Set<(count: number) => void>();

export function readUnreadCount(data: unknown) {
  if (!isRecord(data)) return 0;
  const value = data.unreadCount;
  const count = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.floor(count);
}

export function getUnreadBadge() {
  return cached;
}

export function publishUnreadBadge(count: number) {
  cached = count;
  listeners.forEach((listener) => listener(count));
}

export function subscribeUnreadBadge(listener: (count: number) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 안 읽은 수. 이 조회는 알림을 읽음 처리하지 않는다. */
export async function fetchUnreadCount() {
  const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.notifications.unreadCount);
  return readUnreadCount(res.data);
}
