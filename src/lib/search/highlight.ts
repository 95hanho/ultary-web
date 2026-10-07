import type { ReactNode } from 'react';
import { createElement } from 'react';

/** `@`/`#`로 시작하면 접두 없는 글자도 같이 찾는다. 긴 것 우선 */
function matchNeedles(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  const needles = [q];
  const bare = q.replace(/^[@#]+/, '').trim();
  if (bare && bare.toLowerCase() !== q.toLowerCase()) needles.push(bare);
  return needles.sort((a, b) => b.length - a.length);
}

/** 대소문자 무시 부분 일치 하이라이트 (grass-600). 앞·중간 모두 */
export function highlightMatch(
  text: string,
  query: string,
  highlightClassName: string,
): ReactNode {
  const needles = matchNeedles(query).map((needle) => needle.toLowerCase());
  if (needles.length === 0) return text;

  const lowerText = text.toLowerCase();
  const parts: ReactNode[] = [];
  let index = 0;

  while (index < text.length) {
    let foundAt = -1;
    let foundLength = 0;
    for (const needle of needles) {
      const at = lowerText.indexOf(needle, index);
      if (at === -1) continue;
      if (foundAt === -1 || at < foundAt || (at === foundAt && needle.length > foundLength)) {
        foundAt = at;
        foundLength = needle.length;
      }
    }
    if (foundAt === -1) {
      parts.push(text.slice(index));
      break;
    }
    if (foundAt > index) parts.push(text.slice(index, foundAt));
    parts.push(
      createElement(
        'span',
        { key: `${foundAt}-${foundLength}`, className: highlightClassName },
        text.slice(foundAt, foundAt + foundLength),
      ),
    );
    index = foundAt + foundLength;
  }

  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0];
  return parts;
}

/** pet 태그: 매칭 태그를 앞으로 */
export function sortPetTagsByMatch(tags: string[], query: string): string[] {
  const needles = matchNeedles(query).map((needle) => needle.toLowerCase());
  if (needles.length === 0) return tags;
  const matched: string[] = [];
  const rest: string[] = [];
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (needles.some((needle) => lower.includes(needle))) matched.push(tag);
    else rest.push(tag);
  }
  return [...matched, ...rest];
}
