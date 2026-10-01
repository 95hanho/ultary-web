type RouterPush = { push: (href: string) => void };

export type CommentJump = {
  feedId?: string;
  commentId?: string;
  replyId?: string;
  /** 예전 피드 주소용. 단건 페이지는 feedId만 쓴다 */
  feedOwnerNickname?: string;
};

/** 게시글 하나만 보는 주소 */
export function postPagePath(feedId: string) {
  return `/posts/${feedId}`;
}

/** 댓글 시트가 열린 게시글 단건 주소. `comment`·`reply`가 있으면 그 글로 스크롤 */
export function commentPageHref(target: CommentJump, focus: 'comment' | 'reply'): string | null {
  if (!target.feedId) return null;
  const q = new URLSearchParams();
  q.set('comments', target.feedId);
  if (target.commentId) q.set('comment', target.commentId);
  if (focus === 'reply' && target.replyId) q.set('reply', target.replyId);
  return `${postPagePath(target.feedId)}?${q}`;
}

/** 게시글 단건에서 댓글 시트를 열고, 댓글 또는 답글 위치로 이동 */
export function openFeedComment(
  router: RouterPush,
  target: CommentJump,
  focus: 'comment' | 'reply',
) {
  const href = commentPageHref(target, focus);
  if (href) router.push(href);
}
