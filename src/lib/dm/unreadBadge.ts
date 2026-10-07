import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';

let total: number | null = null;
const counts = new Map<string, number>();
const roomVersion = new Map<string, number>();
let version = 0;
const listeners = new Set<(count: number) => void>();

function idString(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function readCount(value: unknown) {
  const count = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.floor(count);
}

function publish() {
  let sum = 0;
  for (const count of counts.values()) sum += count;
  total = sum;
  listeners.forEach((listener) => listener(sum));
}

function itemsOf(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!isRecord(raw)) return [];
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.content)) return raw.content;
  return [];
}

function remember(id: string, unread: number) {
  version += 1;
  roomVersion.set(id, version);
  counts.set(id, unread);
  publish();
}

export function getDmUnreadBadge() {
  return total;
}

export function subscribeDmUnread(listener: (count: number) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 대화방 하나를 연 뒤. 그 방 안 읽음은 0이다 */
export function clearDmRoomUnread(roomId: string) {
  if (!roomId || counts.get(roomId) === 0) return;
  remember(roomId, 0);
}

/** DM_MESSAGE.room 한 줄의 unreadCount */
export function applyDmSocketRoom(dmRoomId: string, room: unknown) {
  if (!isRecord(room) || typeof room.unreadCount !== 'number') return;
  const id = idString(room.dmRoomId) || idString(room.roomId) || dmRoomId;
  if (!id) return;
  remember(id, readCount(room.unreadCount));
}

/** 목록 조회로 합계를 맞춘다. 요청 중에 소켓이 바꾼 방은 소켓 값을 남긴다 */
export async function fetchDmUnread() {
  const seen = new Map(roomVersion);
  const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.dm.rooms, { limit: 50 });
  const next = new Map<string, number>();
  for (const item of itemsOf(res.data)) {
    if (!isRecord(item)) continue;
    const id = idString(item.dmRoomId) || idString(item.roomId);
    if (!id) continue;
    if ((roomVersion.get(id) ?? 0) !== (seen.get(id) ?? 0)) {
      next.set(id, counts.get(id) ?? readCount(item.unreadCount));
      continue;
    }
    next.set(id, readCount(item.unreadCount));
  }
  for (const [id, count] of counts) {
    if (next.has(id)) continue;
    if ((roomVersion.get(id) ?? 0) !== (seen.get(id) ?? 0)) next.set(id, count);
  }
  counts.clear();
  for (const [id, count] of next) counts.set(id, count);
  publish();
  return total ?? 0;
}
