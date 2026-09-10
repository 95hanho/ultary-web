/** 캐럿 기준 작성 중인 해시태그 토큰 */
export type ActiveHashtag = {
  start: number;
  end: number;
  /** `#` 포함, 캐럿까지 */
  raw: string;
  /** `#` 제외 */
  term: string;
};

const TAG_BODY = /[0-9A-Za-z가-힣_]/;

/** textarea 값·캐럿에서 활성 해시태그 추출 (`#`만 있으면 term 빈 문자열) */
export function getActiveHashtag(value: string, caret: number): ActiveHashtag | null {
  const safeCaret = Math.max(0, Math.min(caret, value.length));
  const left = value.slice(0, safeCaret);
  const match = left.match(/#[0-9A-Za-z가-힣_]*$/);
  if (!match) return null;

  const start = safeCaret - match[0].length;
  if (start > 0) {
    const prev = value[start - 1];
    if (prev !== ' ' && prev !== '\n' && prev !== '\t') return null;
  }

  let end = safeCaret;
  while (end < value.length && TAG_BODY.test(value[end]!)) {
    end += 1;
  }

  const raw = value.slice(start, end);
  return {
    start,
    end,
    raw: match[0],
    term: match[0].slice(1),
  };
}

/** 활성 토큰을 선택 태그로 교체 (뒤에 공백 보장) */
export function replaceActiveHashtag(
  value: string,
  active: ActiveHashtag,
  selectedTag: string,
): { next: string; caret: number } {
  const tag = selectedTag.startsWith('#') ? selectedTag : `#${selectedTag}`;
  const before = value.slice(0, active.start);
  const after = value.slice(active.end);
  const needsSpace = after.length === 0 || !/^\s/.test(after);
  const insertion = needsSpace ? `${tag} ` : tag;
  const next = `${before}${insertion}${after}`;
  return { next, caret: before.length + insertion.length };
}
