import { isTagBoundaryBefore, type ActiveHashtag } from './hashtag-input';

type Token = { start: number; end: number; raw: string };
const valid = (token: Token) => /^#[0-9A-Za-z가-힣_]{1,30}$/.test(token.raw);
function tokens(value: string): Token[] {
  return [...value.matchAll(/#[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ_]+/g)]
    .filter((match) => isTagBoundaryBefore(value, match.index!))
    .map((match) => ({ start: match.index!, end: match.index! + match[0].length, raw: match[0] }));
}

/** Confirmation belongs to each token occurrence, independently of DB existence. */
export class ConfirmedHashtags {
  private value: string;
  private confirmed: Token[];

  constructor(value: string, committed = true) {
    this.value = value;
    this.confirmed = tokens(value).filter(
      (token) => valid(token) && (committed || /\s/.test(value[token.end] ?? '')),
    );
  }

  /** Initial edit data or a draft restored from another screen is already committed text. */
  sync(value: string, committed = true) {
    if (this.value === value) return;
    this.value = value;
    this.confirmed = tokens(value).filter(
      (token) => valid(token) && (committed || /\s/.test(value[token.end] ?? '')),
    );
  }

  isConfirmed(active: ActiveHashtag) {
    return this.confirmed.some(
      (token) =>
        token.start === active.start &&
        token.end === active.end &&
        token.raw === this.value.slice(active.start, active.end),
    );
  }

  confirmAt(start: number) {
    const token = tokens(this.value).find((item) => item.start === start && valid(item));
    if (token && !this.confirmed.some((item) => item.start === start)) this.confirmed.push(token);
  }

  deletionRange(
    key: 'Backspace' | 'Delete',
    start: number,
    end = start,
  ): { start: number; end: number } | null {
    const affected = this.confirmed.filter((token) =>
      start !== end
        ? start < token.end && end > token.start
        : key === 'Backspace'
          ? start > token.start && start <= token.end
          : start >= token.start && start < token.end,
    );
    if (!affected.length) return null;
    return {
      start: Math.min(start, ...affected.map((token) => token.start)),
      end: Math.max(
        end,
        ...affected.map((token) => token.end + (this.value[token.end] === ' ' ? 1 : 0)),
      ),
    };
  }

  remove(range: { start: number; end: number }) {
    return this.edit(
      this.value.slice(0, range.start) + this.value.slice(range.end),
      range.start,
      'insertReplacementText',
      range,
    );
  }

  edit(
    next: string,
    caret: number,
    inputType = '',
    selection?: { start: number; end: number },
  ): { next: string; caret: number } {
    if (next === this.value) return { next, caret };
    if (inputType.startsWith('history')) {
      this.sync(next);
      return { next, caret };
    }
    const previous = this.value;
    const change = (value: string) => {
      if (selection)
        return {
          start: selection.start,
          oldEnd: selection.end,
          newEnd: selection.end + value.length - previous.length,
        };
      if (inputType.startsWith('delete') && value.length < previous.length) {
        const removed = previous.length - value.length;
        if (previous.slice(0, caret) + previous.slice(caret + removed) === value)
          return { start: caret, oldEnd: caret + removed, newEnd: caret };
      }
      let start = 0,
        oldEnd = previous.length,
        newEnd = value.length;
      while (start < oldEnd && start < newEnd && previous[start] === value[start]) start++;
      while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === value[newEnd - 1]) {
        oldEnd--;
        newEnd--;
      }
      return { start, oldEnd, newEnd };
    };
    let range = change(next);
    // Also cover touch keyboards/cut, which may not emit keydown.
    if (
      range.oldEnd > range.start &&
      range.newEnd === range.start &&
      !inputType.startsWith('insert')
    ) {
      const atomic =
        inputType === 'deleteContentBackward'
          ? this.deletionRange('Backspace', range.oldEnd)
          : this.deletionRange('Delete', range.start, range.oldEnd);
      if (atomic) {
        next = previous.slice(0, atomic.start) + previous.slice(atomic.end);
        caret = atomic.start;
        selection = atomic;
        range = change(next);
      }
    }
    const delta = next.length - previous.length;
    const nextTokens = tokens(next);
    const retained: Token[] = [];
    for (const token of this.confirmed) {
      const start =
        token.end <= range.start
          ? token.start
          : token.start >= range.oldEnd
            ? token.start + delta
            : -1;
      const same = nextTokens.find((item) => item.start === start && item.raw === token.raw);
      if (same) retained.push(same);
    }
    // A newly typed delimiter confirms the preceding tag. Existing trailing space
    // does not re-confirm a tag that the user is actively extending before it.
    const insertedWhitespace = /\s/.test(next.slice(range.start, range.newEnd));
    for (const token of nextTokens) {
      const newDelimiter =
        token.end >= range.start && token.end < range.newEnd && /\s/.test(next[token.end] ?? '');
      const spaceAtCaret =
        insertedWhitespace && caret > token.end && /^\s+$/.test(next.slice(token.end, caret));
      if (
        valid(token) &&
        (newDelimiter || spaceAtCaret) &&
        !retained.some((item) => item.start === token.start)
      )
        retained.push(token);
    }
    this.value = next;
    this.confirmed = retained;
    return { next, caret: Math.max(0, Math.min(caret, next.length)) };
  }
}
