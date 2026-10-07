/** 해시태그 설명 팝오버에 넣는 값. 내용은 `loadTagExplain`이 API에서 채운다. */

export type TagExplain = {
  /** # 없이 */
  tag: string;
  title: string;
  imageUrl?: string;
  description: string;
  linkUrl?: string;
  linkLabel?: string;
  /** 이 태그가 달린 게시글 수 */
  postCount?: number;
};

/** 캡션에서 해시태그 토큰 분리 */
export function splitCaptionTags(caption: string): Array<{ type: 'text' | 'tag'; value: string }> {
  const re = /(#[0-9A-Za-z가-힣_]+)/g;
  const parts: Array<{ type: 'text' | 'tag'; value: string }> = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(caption)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: caption.slice(last, match.index) });
    }
    parts.push({ type: 'tag', value: match[0] });
    last = match.index + match[0].length;
  }
  if (last < caption.length) {
    parts.push({ type: 'text', value: caption.slice(last) });
  }
  return parts.length > 0 ? parts : [{ type: 'text', value: caption }];
}
