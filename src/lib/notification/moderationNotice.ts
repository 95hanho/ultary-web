import { commentPageHref, postPagePath, type CommentJump } from './openTarget';

/** 서비스 안내 문장에서 대상 명칭만 이동 링크로 만든다. 예전 알림에 대상 정보가 없으면 일반 텍스트다. */
export function moderationNoticeParts(message: string, target: CommentJump) {
  return message.split(/(게시글|댓글|답글)/g).map((text) => {
    let href: string | null = null;
    if (target.feedId) {
      if (text === '게시글') href = postPagePath(target.feedId);
      if (text === '댓글' && target.commentId) href = commentPageHref(target, 'comment');
      if (text === '답글' && target.replyId) href = commentPageHref(target, 'reply');
    }
    return { text, href };
  });
}
