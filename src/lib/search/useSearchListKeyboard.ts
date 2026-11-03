'use client';

import { useRef, type KeyboardEvent, type RefObject } from 'react';

/** Move between primary result actions, leaving delete and clear buttons separate. */
export function useSearchListKeyboard(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  placement: 'below' | 'above' = 'below',
) {
  const selection = useRef<{ start: number; end: number } | null>(null);
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.nativeEvent.isComposing || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp'))
      return;
    const input = inputRef.current;
    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[data-search-option]'),
    ).filter((option) => !option.matches(':disabled') && option.getClientRects().length > 0);
    const target = event.target as HTMLElement;
    let index = options.indexOf(target);
    if (target === input) {
      if (event.key !== (placement === 'above' ? 'ArrowUp' : 'ArrowDown') || !options.length)
        return;
      selection.current =
        input.selectionStart == null
          ? null
          : {
              start: input.selectionStart,
              end: input.selectionEnd ?? input.selectionStart,
            };
      index = placement === 'above' ? options.length : -1;
    } else if (index < 0) return;
    event.preventDefault();
    if (
      (placement === 'below' && event.key === 'ArrowUp' && index === 0) ||
      (placement === 'above' && event.key === 'ArrowDown' && index === options.length - 1)
    ) {
      input?.focus({ preventScroll: true });
      if (selection.current)
        input?.setSelectionRange(selection.current.start, selection.current.end);
      return;
    }
    const next =
      options[
        Math.max(0, Math.min(options.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))
      ];
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: 'nearest' });
  };
}
