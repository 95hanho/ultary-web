export type ActiveMention = { start: number; end: number; term: string };
const mentionPattern = /(?<!\S)@[\p{L}\p{N}_]+/gu;
export function mentionTokens(value: string) {
  return Array.from(value.matchAll(mentionPattern), (m) => ({
    start: m.index!,
    end: m.index! + m[0].length,
    text: m[0],
  }));
}
export function activeMention(value: string, caret: number): ActiveMention | null {
  const match = value.slice(0, caret).match(/(?:^|\s)@([\p{L}\p{N}_]*)$/u);
  if (!match) return null;
  const term = match[1];
  const start = caret - term.length - 1;
  const tail = value.slice(caret).match(/^[\p{L}\p{N}_]*/u)?.[0] ?? '';
  if (value.slice(caret + tail.length).startsWith('.')) return null;
  return { start, end: caret + tail.length, term };
}
/** Move a committed mention behind the existing leading mention block. */
export function replaceMention(
  value: string,
  active: ActiveMention,
  nickname: string,
  selected?: MentionUser[],
) {
  const label = '@' + nickname.replace(/^@+/, '');
  const before = value.slice(0, active.start);
  const after = value.slice(active.end).replace(/^ +/, '');
  const remaining = before + after;
  let body = remaining.trimStart();
  let bodyCaret = before.length - (remaining.length - body.length);
  const labels: string[] = [];
  let next: RegExpMatchArray | null;
  while ((next = body.match(/^(@[\p{L}\p{N}_]+)\s+/u))) {
    if (selected && !selected.some((person) => '@' + person.nickname === next![1])) break;
    if (!labels.includes(next[1])) labels.push(next[1]);
    body = body.slice(next[0].length);
    bodyCaret -= next[0].length;
  }
  if (!labels.includes(label)) labels.push(label);
  const prefix = labels.join(' ') + ' ';
  return {
    value: prefix + body,
    caret: prefix.length + Math.max(0, Math.min(body.length, bodyCaret)),
  };
}
export type MentionUser = { userNo: number; nickname: string };
/** Only the first occurrence of an explicitly selected identity is an atomic mention. */
export function selectedMentionTokens(value: string, people: MentionUser[]) {
  const used = new Set<number>();
  return mentionTokens(value).filter((token) => {
    const person = people.find((p) => p.nickname === token.text.slice(1));
    if (!person || used.has(person.userNo)) return false;
    used.add(person.userNo);
    return true;
  });
}
export function retainMentionUsers(previous: string, next: string, people: MentionUser[]) {
  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++;
  let oldEnd = previous.length,
    newEnd = next.length;
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  const changed = selectedMentionTokens(previous, people)
    .filter((token) =>
      start === oldEnd
        ? (start > token.start && start < token.end) ||
          (start === token.end && !/^\s*$/.test(next.slice(start, newEnd)))
        : start < token.end && oldEnd > token.start,
    )
    .map((token) => token.text.slice(1));
  const names = new Set(mentionTokens(next).map((token) => token.text.slice(1)));
  return people.filter(
    (person) => !changed.includes(person.nickname) && names.has(person.nickname),
  );
}
export function mentionPayload(value: string, people: MentionUser[]) {
  const names = new Set(mentionTokens(value).map((token) => token.text.slice(1)));
  return people
    .filter(
      (person, index) =>
        names.has(person.nickname) &&
        people.findIndex((other) => other.userNo === person.userNo) === index,
    )
    .map(({ userNo }) => ({ userNo }));
}
/** A completed mention and its trailing separator form one deletion unit. */
export function mentionDeletion(
  value: string,
  start: number,
  end: number,
  backward: boolean,
  selected?: MentionUser[],
) {
  const tokens = selected
    ? selectedMentionTokens(value, selected)
    : mentionTokens(value).filter((t) => /\s/.test(value[t.end] ?? ''));
  let from = start,
    to = end;
  for (const t of tokens) {
    const edge = value[t.end] === ' ' ? t.end + 1 : t.end;
    const touches =
      start === end
        ? backward
          ? start > t.start && start <= edge
          : start >= t.start && start < t.end
        : start < t.end && end > t.start;
    if (touches) {
      from = Math.min(from, t.start);
      to = Math.max(to, edge);
    }
  }
  return from !== start || to !== end ? { start: from, end: to } : null;
}
