/** `/myultary/{from}/…` → `/myultary/{to}/…` (하위 경로 유지). 클라이언트·서버 공용. */
export function replaceUltaryNicknameInPath(pathname: string, from: string, to: string): string {
  const parts = pathname.split('/');
  if (parts.length < 3 || parts[1] !== 'myultary') return pathname;
  let segment = parts[2] ?? '';
  try {
    segment = decodeURIComponent(segment);
  } catch {
    /* keep raw */
  }
  if (segment !== from) return pathname;
  parts[2] = encodeURIComponent(to);
  return parts.join('/');
}
