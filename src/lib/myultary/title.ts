import { nicknameTag } from '@/lib/nickname-tag';
export function ultaryTitle(nickname: string, handles: string[]) {
  const tags = handles.filter(Boolean).join(',');
  return `${nicknameTag(nickname)}${tags ? `(${tags})` : ''}님의 울타리 - Ultary`;
}
