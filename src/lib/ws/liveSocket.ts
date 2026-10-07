import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { SPRING_WS_URL } from '@/lib/env.client';
import {
  fetchUnreadCount,
  publishUnreadBadge,
  readUnreadCount,
} from '@/lib/notification/unreadBadge';
import { applyDmSocketRoom, fetchDmUnread } from '@/lib/dm/unreadBadge';
import type { BffEnvelope } from '@/types/api';

export type DmSocketEvent = {
  dmRoomId: string;
  room: unknown;
  message: unknown;
};

export type DmReadEvent = {
  dmRoomId: string;
  lastReadMessageId: string;
};

export type DmTypingEvent = {
  dmRoomId: string;
  userNo: string;
  typing: boolean;
};

const dmListeners = new Set<(event: DmSocketEvent) => void>();
const dmReadListeners = new Set<(event: DmReadEvent) => void>();
const dmTypingListeners = new Set<(event: DmTypingEvent) => void>();

let socket: WebSocket | null = null;
let connecting = false;
let authed = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryMs = 1000;
let generation = 0;

function idString(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

export function isLiveSocketAuthed() {
  return authed;
}

export function subscribeDmMessage(listener: (event: DmSocketEvent) => void) {
  dmListeners.add(listener);
  return () => {
    dmListeners.delete(listener);
  };
}

export function subscribeDmRead(listener: (event: DmReadEvent) => void) {
  dmReadListeners.add(listener);
  return () => {
    dmReadListeners.delete(listener);
  };
}

export function subscribeDmTyping(listener: (event: DmTypingEvent) => void) {
  dmTypingListeners.add(listener);
  return () => {
    dmTypingListeners.delete(listener);
  };
}

export function ensureLiveSocket() {
  if (typeof window === 'undefined') return;
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }
  void connect();
}

function scheduleRetry() {
  if (retryTimer != null) return;
  const wait = retryMs;
  retryMs = Math.min(retryMs * 2, 15000);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    ensureLiveSocket();
  }, wait);
}

function handleFrame(data: unknown) {
  if (typeof data !== 'string') return;
  let raw: unknown;
  try {
    raw = JSON.parse(data);
  } catch {
    return;
  }
  if (!isRecord(raw) || typeof raw.type !== 'string') return;
  if (raw.type === 'PING' || raw.type === 'AUTH') return;
  if (raw.type === 'AUTH_OK') {
    authed = true;
    retryMs = 1000;
    return;
  }
  if (raw.type === 'NOTIFICATION_UNREAD') {
    publishUnreadBadge(readUnreadCount(raw));
    return;
  }
  if (raw.type === 'DM_MESSAGE') {
    const dmRoomId = idString(raw.dmRoomId);
    if (!dmRoomId) return;
    applyDmSocketRoom(dmRoomId, raw.room);
    const event = { dmRoomId, room: raw.room, message: raw.message };
    dmListeners.forEach((listener) => listener(event));
    return;
  }
  if (raw.type === 'DM_READ') {
    const dmRoomId = idString(raw.dmRoomId);
    const lastReadMessageId = idString(raw.lastReadMessageId);
    if (!dmRoomId || !lastReadMessageId) return;
    const event = { dmRoomId, lastReadMessageId };
    dmReadListeners.forEach((listener) => listener(event));
    return;
  }
  if (raw.type === 'DM_TYPING') {
    const dmRoomId = idString(raw.dmRoomId);
    const userNo = idString(raw.userNo);
    if (!dmRoomId || typeof raw.typing !== 'boolean') return;
    const event = { dmRoomId, userNo, typing: raw.typing };
    dmTypingListeners.forEach((listener) => listener(event));
  }
}

async function connect() {
  if (connecting) return;
  connecting = true;
  const gen = ++generation;
  try {
    const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.ws.ticket, {});
    if (gen !== generation) return;
    const ticket =
      isRecord(res.data) && typeof res.data.ticket === 'string' ? res.data.ticket : '';
    if (!ticket) {
      scheduleRetry();
      return;
    }
    const ws = new WebSocket(SPRING_WS_URL);
    socket = ws;
    ws.onopen = () => {
      if (gen !== generation) {
        ws.close();
        return;
      }
      ws.send(JSON.stringify({ type: 'AUTH', ticket }));
    };
    ws.onmessage = (event) => handleFrame(event.data);
    ws.onclose = () => {
      if (socket === ws) socket = null;
      const wasAuthed = authed;
      authed = false;
      if (gen !== generation) return;
      if (wasAuthed) {
        void fetchUnreadCount()
          .then((count) => {
            if (!authed) publishUnreadBadge(count);
          })
          .catch(() => undefined);
        void fetchDmUnread().catch(() => undefined);
      }
      scheduleRetry();
    };
  } catch (err) {
    if (isHttpError(err) && (err.status === 401 || err.status === 403)) return;
    scheduleRetry();
  } finally {
    connecting = false;
  }
}
