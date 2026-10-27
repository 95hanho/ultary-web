'use client';

import { useLayoutEffect, useRef } from 'react';
import { dmOpeningScrollTop } from './openingMessages';

type ScrollSnapshot = {
  roomKey: string;
  firstId?: string;
  lastId?: string;
  count: number;
  height: number;
};

export function useDmThreadScroll(
  roomKey: string,
  ready: boolean,
  firstUnreadId: string | null,
  messages: readonly { id: string; fromMe: boolean }[],
  peerTyping: boolean,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previous = useRef<ScrollSnapshot | null>(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) {
      previous.current = null;
      return;
    }
    const firstId = messages[0]?.id;
    const last = messages[messages.length - 1];
    const before = previous.current;
    if (!before || before.roomKey !== roomKey) {
      const anchor = firstUnreadId
        ? Array.from(container.querySelectorAll<HTMLElement>('[data-dm-message-id]')).find(
            (element) => element.dataset.dmMessageId === firstUnreadId,
          )
        : undefined;
      const anchorTop = anchor
        ? container.scrollTop +
          anchor.getBoundingClientRect().top -
          container.getBoundingClientRect().top -
          container.clientTop
        : undefined;
      container.scrollTop = dmOpeningScrollTop(
        container.scrollHeight,
        container.clientHeight,
        anchorTop,
        anchor?.offsetHeight,
      );
    } else if (
      firstId !== before.firstId &&
      last?.id === before.lastId &&
      messages.length > before.count
    ) {
      // Native scroll anchoring is disabled on this container to avoid applying this twice.
      container.scrollTop += container.scrollHeight - before.height;
    } else {
      const wasNearBottom = before.height - container.clientHeight - container.scrollTop <= 80;
      if (wasNearBottom || (last?.id !== before.lastId && last?.fromMe)) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
    previous.current = {
      roomKey,
      firstId,
      lastId: last?.id,
      count: messages.length,
      height: container.scrollHeight,
    };
  }, [roomKey, ready, firstUnreadId, messages, peerTyping]);
  return containerRef;
}
