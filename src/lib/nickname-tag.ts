/** DB/API nickname은 @ 없는 본문, 화면에서는 @를 한 번만 붙인다. */
export function nicknameTag(value: string): string {
  return value ? `@${value.replace(/^@+/, '')}` : '';
}
