import { bffDelete, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import type { MockComment } from '@/lib/mock/comments';

export type CommentLikeTarget = { commentId: string; replyId?: string };
export type CommentLikeState = { isLiked: boolean; likeCount: number };

export async function saveCommentLike(
  feedId: string,
  target: CommentLikeTarget,
  liked: boolean,
): Promise<CommentLikeState> {
  const endpoint = target.replyId ? bffEndpoints.feeds.replyLike : bffEndpoints.feeds.commentLike;
  const params = { feedId, ...target };
  const response = liked
    ? await bffPostJson<BffEnvelope<unknown>>(endpoint, params)
    : await bffDelete<BffEnvelope<unknown>>(endpoint, params);
  const data = response.data;
  if (
    !isRecord(data) ||
    typeof data.likedByMe !== 'boolean' ||
    typeof data.likeCount !== 'number' ||
    !Number.isFinite(data.likeCount) ||
    data.likeCount < 0
  )
    throw Error('좋아요 응답을 확인할 수 없습니다.');
  return { isLiked: data.likedByMe, likeCount: data.likeCount };
}

export function patchCommentLike(
  items: MockComment[],
  target: CommentLikeTarget,
  state: CommentLikeState,
): MockComment[] {
  return items.map((comment) => {
    if (comment.id !== target.commentId) return comment;
    if (!target.replyId) return { ...comment, ...state };
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === target.replyId ? { ...reply, ...state } : reply,
      ),
    };
  });
}
