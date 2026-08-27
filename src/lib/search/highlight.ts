import type { ReactNode } from 'react';
import { createElement } from 'react';

/** 대소문자 무시 부분 일치 하이라이트 (grass-600) */
export function highlightMatch(
  text: string,
  query: string,
  highlightClassName: string,
): ReactNode {
  const q = query.trim();
  if (!q) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const parts: ReactNode[] = [];
  let start = 0;
  let index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  while (index !== -1) {
    if (index > start) parts.push(text.slice(start, index));
    parts.push(
      createElement(
        'span',
        { key: `${index}-${q}`, className: highlightClassName },
        text.slice(index, index + q.length),
      ),
    );
    start = index + q.length;
    index = lowerText.indexOf(lowerQuery, start);
  }

  if (start < text.length) parts.push(text.slice(start));
  return parts;
}

/** pet 태그: 매칭 태그를 앞으로 */
export function sortPetTagsByMatch(tags: string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return tags;
  const matched: string[] = [];
  const rest: string[] = [];
  for (const tag of tags) {
    if (tag.toLowerCase().includes(q)) matched.push(tag);
    else rest.push(tag);
  }
  return [...matched, ...rest];
}
