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
const HASHTAG_TOKEN = /#[0-9A-Za-z가-힣_]+/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 본문의 해시태그 본문들 (`#` 제외, 등장 순) */
export function listHashtagBodies(caption: string): string[] {
  const out: string[] = [];
  const re = new RegExp(HASHTAG_TOKEN.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(caption)) !== null) {
    out.push(match[0].slice(1));
  }
  return out;
}

/** `#` 없는 소문자 키 */
export function normalizeHashtagBody(tag: string): string {
  return tag.replace(/^#/, '').trim().toLowerCase();
}

/**
 * DB에 있는(기존) 태그만 본문에서 제거. 신규 `#새태그`는 남긴다.
 * `existingBodies`: `#` 없는 소문자 본문 Set/배열
 */
export function stripExistingHashtags(
  caption: string,
  existingBodies: Iterable<string>,
): string {
  const existing = new Set(
    [...existingBodies].map((body) => normalizeHashtagBody(body)).filter(Boolean),
  );
  if (existing.size === 0) return caption;
  return caption.replace(HASHTAG_TOKEN, (token) => {
    const body = normalizeHashtagBody(token);
    return existing.has(body) ? '' : token;
  });
}

/** 기존 태그만 뺀 본문 글자 수(공백 포함). 신규 해시태그는 포함 */
export function captionPlainLengthExcluding(
  caption: string,
  existingBodies: Iterable<string>,
): number {
  return stripExistingHashtags(caption, existingBodies).length;
}

/** @deprecated 모든 해시태그 제거 — 추천 enable/q 에는 stripExistingHashtags 사용 */
export function stripHashtags(caption: string): string {
  return caption.replace(HASHTAG_TOKEN, '');
}

/** @deprecated captionPlainLengthExcluding 사용 */
export function captionPlainLength(caption: string): number {
  return stripHashtags(caption).length;
}

/** 캡션에 동일 해시태그가 이미 있는지 (`#` 유무 무시) */
export function captionHasHashtag(caption: string, tag: string): boolean {
  const body = tag.replace(/^#/, '').trim();
  if (!body) return false;
  const re = new RegExp(`(^|[\\s\\n\\t])#${escapeRegExp(body)}(?=[\\s\\n\\t]|$)`, 'i');
  return re.test(caption);
}

/** 본문 끝에 해시태그 추가(중복이면 그대로). 뒤에 공백 보장 */
export function appendHashtagIfAbsent(
  caption: string,
  tag: string,
): { next: string; caret: number; added: boolean } {
  const normalized = tag.startsWith('#') ? tag : `#${tag}`;
  if (captionHasHashtag(caption, normalized)) {
    return { next: caption, caret: caption.length, added: false };
  }
  const needsSpace = caption.length > 0 && !/\s$/.test(caption);
  const insertion = `${needsSpace ? ' ' : ''}${normalized} `;
  const next = `${caption}${insertion}`;
  return { next, caret: next.length, added: true };
}

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

/**
 * 완료된 한 글자 해시태그(`#가 ` 등)가 있는지.
 * `#` 단독·2글자 이상은 false.
 */
export function hasCompletedSingleCharHashtag(value: string): boolean {
  const re = /(^|[\s\n\t])#([0-9A-Za-z가-힣_])(?=[\s\n\t]|$)/g;
  return re.test(value);
}

/** blur/공백 시 한 글자 태그 경고를 띄울지 */
export function shouldWarnSingleCharHashtag(value: string, caret: number): boolean {
  if (hasCompletedSingleCharHashtag(value)) return true;
  const active = getActiveHashtag(value, caret);
  return Boolean(active && active.term.length === 1);
}

function isTagBoundaryBefore(value: string, start: number): boolean {
  if (start <= 0) return true;
  const prev = value[start - 1];
  return prev === ' ' || prev === '\n' || prev === '\t';
}

/** `pos`가 가리키는 글자를 포함하는 해시태그 토큰 (`#`~본문) */
export function findHashtagTokenAt(
  value: string,
  pos: number,
): { start: number; end: number } | null {
  if (pos < 0 || pos >= value.length) return null;
  const re = /#[0-9A-Za-z가-힣_]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (!isTagBoundaryBefore(value, start)) continue;
    if (pos >= start && pos < end) return { start, end };
  }
  return null;
}

/** 뒤에 본문 글자가 없으면 아직 입력 중(뭉탱이 아님) */
export function isHashtagClosed(value: string, tokenEnd: number): boolean {
  if (tokenEnd >= value.length) return false;
  return !TAG_BODY.test(value[tokenEnd]!);
}

/**
 * Backspace 시 통째로 지울 해시태그 구간.
 * - 확정된 태그(`#태그 ` / `#태그`+구분자)만 대상. 입력 중(`#태그|` EOS)은 null.
 * - 태그 뒤 공백 한 칸까지 포함.
 */
export function atomicHashtagRangeForBackspace(
  value: string,
  caret: number,
): { start: number; end: number } | null {
  if (caret <= 0) return null;

  if (value[caret - 1] === ' ') {
    const token = findHashtagTokenAt(value, caret - 2);
    if (token && token.end === caret - 1 && isTagBoundaryBefore(value, token.start)) {
      return { start: token.start, end: caret };
    }
    return null;
  }

  const token = findHashtagTokenAt(value, caret - 1);
  if (!token || !isHashtagClosed(value, token.end)) return null;
  if (caret <= token.start || caret > token.end) return null;

  let end = token.end;
  if (end < value.length && value[end] === ' ') end += 1;
  return { start: token.start, end };
}

/**
 * Delete 시 통째로 지울 해시태그 구간 (캐럿이 확정 태그 앞에 있을 때).
 */
export function atomicHashtagRangeForDelete(
  value: string,
  caret: number,
): { start: number; end: number } | null {
  if (caret >= value.length) return null;
  const token = findHashtagTokenAt(value, caret);
  if (!token || token.start !== caret || !isHashtagClosed(value, token.end)) return null;
  let end = token.end;
  if (end < value.length && value[end] === ' ') end += 1;
  return { start: token.start, end };
}
