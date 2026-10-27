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
  const alignment = useRef({ opening: true, pinned: true });
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
      alignment.current = { opening: true, pinned: !firstUnreadId };
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
      alignment.current.opening = false;
      // Native scroll anchoring is disabled on this container to avoid applying this twice.
      container.scrollTop += container.scrollHeight - before.height;
    } else {
      const wasNearBottom = before.height - container.clientHeight - container.scrollTop <= 80;
      if (wasNearBottom || (last?.id !== before.lastId && last?.fromMe)) {
        alignment.current = { opening: false, pinned: true };
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

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !ready) return;
    const stopOpeningAlignment = () => {
      alignment.current.opening = false;
    };
    const trackScroll = () => {
      alignment.current.pinned =
        container.scrollHeight - container.clientHeight - container.scrollTop <= 80;
    };
    const resize = new ResizeObserver(() => {
      if (alignment.current.opening) {
        const anchor = firstUnreadId
          ? Array.from(container.querySelectorAll<HTMLElement>('[data-dm-message-id]')).find(
              (element) => element.dataset.dmMessageId === firstUnreadId,
            )
          : undefined;
        const top = anchor
          ? container.scrollTop +
            anchor.getBoundingClientRect().top -
            container.getBoundingClientRect().top -
            container.clientTop
          : undefined;
        container.scrollTop = dmOpeningScrollTop(
          container.scrollHeight,
          container.clientHeight,
          top,
          anchor?.offsetHeight,
        );
      } else if (alignment.current.pinned) {
        container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      }
      if (previous.current) previous.current.height = container.scrollHeight;
    });
    // Images and fonts can change individual row heights after the first layout.
    resize.observe(container);
    for (const child of Array.from(container.children)) resize.observe(child);
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
      container.addEventListener(event, stopOpeningAlignment, { passive: true });
    }
    container.addEventListener('scroll', trackScroll, { passive: true });
    return () => {
      resize.disconnect();
      for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
        container.removeEventListener(event, stopOpeningAlignment);
      }
      container.removeEventListener('scroll', trackScroll);
    };
  }, [roomKey, ready, firstUnreadId, messages, peerTyping]);
  return containerRef;
}
