export function ultaryTitle(nickname: string, handles: string[]) {
  const tags = handles.filter(Boolean).join(',');
  return `${nickname}${tags ? `(${tags})` : ''}님의 울타리 - Ultary`;
}
