/** 게시글 본문·댓글·답글 공통 글자 수 상한 */
export const FEED_CONTENT_MAX_LENGTH = 100;

export function clampFeedContent(value: string): string {
  if (value.length <= FEED_CONTENT_MAX_LENGTH) return value;
  return value.slice(0, FEED_CONTENT_MAX_LENGTH);
}
