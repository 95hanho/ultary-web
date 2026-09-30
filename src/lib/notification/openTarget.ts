import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedData } from '@/lib/feed/toFeedData';
import { MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import type { BffEnvelope } from '@/types/api';

type RouterPush = { push: (href: string) => void };

export type CommentJump = {
  feedId?: string;
  commentId?: string;
  replyId?: string;
  /** 게시글 주인 닉네임. 없으면 피드 단건에서 읽는다 */
  feedOwnerNickname?: string;
};

/** 댓글 시트가 열린 게시글 주소. `comment`·`reply`가 있으면 그 글로 스크롤 */
export function commentPageHref(target: CommentJump, focus: 'comment' | 'reply'): string | null {
  if (!target.feedId || !target.feedOwnerNickname) return null;
  const q = new URLSearchParams();
  q.set('comments', target.feedId);
  if (target.commentId) q.set('comment', target.commentId);
  if (focus === 'reply' && target.replyId) q.set('reply', target.replyId);
  return `${myUltaryPath(target.feedOwnerNickname)}/posts/${target.feedId}?${q}`;
}

async function ownerNickname(target: CommentJump): Promise<string> {
  const known = target.feedOwnerNickname?.trim();
  if (known) return known;
  if (!target.feedId) return MY_NICKNAME;
  try {
    const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.feeds.detail, {
      feedId: target.feedId,
    });
    const nick = toFeedData(res.data, target.feedId).nickname?.trim();
    if (nick) return nick;
  } catch (err) {
    console.warn('[comments] owner lookup failed', err);
  }
  return MY_NICKNAME;
}

/** 게시글 댓글 시트를 열고, 댓글 또는 답글 위치로 이동 */
export async function openFeedComment(
  router: RouterPush,
  target: CommentJump,
  focus: 'comment' | 'reply',
) {
  if (!target.feedId) return;
  const nickname = await ownerNickname(target);
  const href = commentPageHref({ ...target, feedOwnerNickname: nickname }, focus);
  if (href) router.push(href);
}
