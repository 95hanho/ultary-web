'use client';
import { forwardRef, useRef, useCallback, useLayoutEffect, type TextareaHTMLAttributes } from 'react';
import {
  activeMention,
  mentionDeletion,
  selectedMentionTokens,
  type MentionUser,
  type ActiveMention,
} from '@/lib/search/mention-input';
import styles from './MentionInput.module.scss';
type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string;
  onValueChange: (value: string) => void;
  onMentionChange: (active: ActiveMention | null) => void;
  selectedUsers?: MentionUser[];
  active?: ActiveMention | null;
  onRemoveMention?: (nickname: string) => void;
};
export const MentionInput = forwardRef<HTMLTextAreaElement, Props>(function MentionInput(
  {
    value,
    onValueChange,
    onMentionChange,
    selectedUsers = [],
    active,
    onRemoveMention,
    maxLength,
    onBlur,
    onKeyDown,
    ...props
  },
  ref,
) {
  const backdrop = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const detect = (el: HTMLTextAreaElement) => {
    onMentionChange(activeMention(el.value, el.selectionStart ?? el.value.length));
  };
  const remove = useCallback(
    (el: HTMLTextAreaElement, backward: boolean) => {
      const start = el.selectionStart ?? value.length,
        end = el.selectionEnd ?? start;
      const range = mentionDeletion(value, start, end, backward, selectedUsers);
      if (!range) return false;
      for (const token of selectedMentionTokens(value, selectedUsers)) {
        if (token.start < range.end && token.end > range.start)
          onRemoveMention?.(token.text.slice(1));
      }
      const next = value.slice(0, range.start) + value.slice(range.end);
      onValueChange(next);
      onMentionChange(null);
      requestAnimationFrame(() => {
        el.setSelectionRange(range.start, range.start);
        if (backdrop.current) backdrop.current.scrollTop = el.scrollTop;
      });
      return true;
    },
    [value, onValueChange, onMentionChange, selectedUsers, onRemoveMention],
  );
  const resize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 5 * 20 + 18;
    const height = Math.min(Math.max(el.scrollHeight, 38), maxHeight);
    el.style.height = `${height}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    if (backdrop.current) {
      backdrop.current.style.width = `${el.clientWidth}px`;
      backdrop.current.scrollTop = el.scrollTop;
    }
  }, []);
  useLayoutEffect(resize, [value, resize]);
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    let width = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width === el.clientWidth) return;
      width = el.clientWidth;
      resize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [resize]);
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    // Native beforeinput also covers mobile keyboards that emit no Backspace keydown.
    const onBeforeInput = (event: InputEvent) => {
      if (event.isComposing || !event.cancelable) return;
      if (
        ['deleteContentBackward', 'deleteContentForward'].includes(event.inputType) &&
        remove(el, event.inputType === 'deleteContentBackward')
      )
        event.preventDefault();
    };
    el.addEventListener('beforeinput', onBeforeInput);
    return () => el.removeEventListener('beforeinput', onBeforeInput);
  }, [remove]);
  const parts = [];
  let cursor = 0;
  const tokens = selectedMentionTokens(value, selectedUsers);
  if (active && !tokens.some((token) => token.start === active.start))
    tokens.push({ ...active, text: value.slice(active.start, active.end) });
  tokens.sort((a, b) => a.start - b.start);
  for (const token of tokens) {
    parts.push(value.slice(cursor, token.start));
    parts.push(<strong key={token.start}>{token.text}</strong>);
    cursor = token.end;
  }
  parts.push(value.slice(cursor));
  return (
    <div className={styles.field}>
      <div ref={backdrop} className={styles.backdrop} aria-hidden>
        {parts}{'\n'}
      </div>
      <textarea
        {...props}
        rows={1}
        ref={(element) => {
          inputRef.current = element;
          if (typeof ref === 'function') ref(element);
          else if (ref) ref.current = element;
        }}
        className={styles.input}
        value={value}
        maxLength={maxLength}
        onChange={(e) => {
          const next = e.target.value.slice(0, maxLength);
          onValueChange(next);
          detect(e.currentTarget);
        }}
        onSelect={(e) => detect(e.currentTarget)}
        onFocus={(e) => detect(e.currentTarget)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          detect(e.currentTarget);
        }}
        onScroll={(e) => {
          if (backdrop.current) backdrop.current.scrollTop = e.currentTarget.scrollTop;
        }}
        onKeyDown={(e) => {
          if (composing.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (e.key === 'Escape') {
            e.preventDefault();
            onMentionChange(null);
          }
          if (
            (e.key === 'Backspace' || e.key === 'Delete') &&
            remove(e.currentTarget, e.key === 'Backspace')
          )
            e.preventDefault();
          if (!e.defaultPrevented) onKeyDown?.(e);
        }}
        onBlur={onBlur}
      />
    </div>
  );
});
