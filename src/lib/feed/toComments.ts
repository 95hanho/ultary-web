import { bffDelete, bffGet, bffPatchJson, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { readMyReport } from '@/lib/report/openReport';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import type { MockComment, MockCommentReply } from '@/lib/mock/comments';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope } from '@/types/api';
import type { FileSummary } from '@/types/file';

const PAGE_SIZE = 20;
const MAX_PAGES = 10;

type Page = {
  items: unknown[];
  nextCursor: string | null;
};

function asFile(
  value: unknown,
): Pick<FileSummary, 'fileId' | 'filePath'> | null {
  if (!isRecord(value)) return null;
  if (typeof value.filePath !== 'string' || !value.filePath.trim()) return null;
  const fileId = value.fileId;
  return {
    fileId: typeof fileId === 'number' ? fileId : 0,
    filePath: value.filePath,
  };
}

function pickNickname(raw: Record<string, unknown>): string {
  const author = isRecord(raw.author) ? raw.author : null;
  const user = isRecord(raw.user) ? raw.user : null;
  const candidates = [
    raw.nickname,
    raw.authorNickname,
    author?.nickname,
    user?.nickname,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  if (typeof raw.userNo === 'number') return String(raw.userNo);
  return '이웃';
}

function pickProfile(raw: Record<string, unknown>): string {
  const author = isRecord(raw.author) ? raw.author : null;
  const user = isRecord(raw.user) ? raw.user : null;
  const file =
    asFile(raw.authorProfileFile) ??
    asFile(raw.profileFile) ??
    asFile(author?.profileFile) ??
    asFile(user?.profileFile);
  return resolveFileDisplayUrl(file) ?? NO_PROFILE_SRC;
}

function pickId(raw: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'number' || typeof value === 'string') {
      const id = String(value).trim();
      if (id) return id;
    }
  }
  return null;
}

/** 댓글 시각을 시트에 쓰던 짧은 표기로 바꿈 */
export function formatCommentTime(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일`;
  return `${date.getMonth() + 1}월${date.getDate()}일`;
}

function mapReply(raw: unknown): MockCommentReply | null {
  if (!isRecord(raw)) return null;
  const id = pickId(raw, ['feedReplyId', 'replyId', 'id']);
  if (!id) return null;
  const content = typeof raw.content === 'string' ? raw.content : '';
  const likeCount = typeof raw.likeCount === 'number' ? raw.likeCount : 0;
  const liked = raw.likedByMe === true || raw.isLiked === true;
  return {
    id,
    nickname: pickNickname(raw),
    profileUrl: pickProfile(raw),
    content,
    timeLabel: formatCommentTime(raw.createdAt ?? raw.created_at),
    likeCount,
    isLiked: liked || undefined,
    userNo: typeof raw.userNo === 'number' ? raw.userNo : undefined,
    myReport: readMyReport(raw),
  };
}

function embeddedReplies(raw: Record<string, unknown>): unknown[] | null {
  if (Array.isArray(raw.replies)) return raw.replies;
  if (Array.isArray(raw.replyList)) return raw.replyList;
  return null;
}

function mapComment(raw: unknown): { comment: MockComment; fetchReplies: boolean } | null {
  if (!isRecord(raw)) return null;
  const id = pickId(raw, ['feedCommentId', 'commentId', 'id']);
  if (!id) return null;
  const nested = embeddedReplies(raw);
  const replies = (nested ?? []).map(mapReply).filter((v): v is MockCommentReply => v != null);
  const likeCount = typeof raw.likeCount === 'number' ? raw.likeCount : 0;
  const liked = raw.likedByMe === true || raw.isLiked === true;
  return {
    fetchReplies: nested == null,
    comment: {
      id,
      nickname: pickNickname(raw),
      profileUrl: pickProfile(raw),
      content: typeof raw.content === 'string' ? raw.content : '',
      timeLabel: formatCommentTime(raw.createdAt ?? raw.created_at),
      likeCount,
      isLiked: liked || undefined,
      userNo: typeof raw.userNo === 'number' ? raw.userNo : undefined,
      myReport: readMyReport(raw),
      replies,
    },
  };
}

function listFrom(raw: Record<string, unknown>): unknown[] | null {
  for (const key of ['items', 'content', 'comments', 'list', 'data']) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
  }
  return null;
}

function cursorFrom(raw: Record<string, unknown>): string | null {
  for (const key of ['nextCursor', 'nextCursorCommentId', 'nextCursorReplyId']) {
    const value = raw[key];
    if (typeof value === 'number' && value > 0) return String(value);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function unwrapPage(raw: unknown): Page {
  if (Array.isArray(raw)) return { items: raw, nextCursor: null };
  if (!isRecord(raw)) return { items: [], nextCursor: null };
  const nested = isRecord(raw.data) && !Array.isArray(raw.data) ? raw.data : raw;
  const items = listFrom(nested) ?? listFrom(raw) ?? [];
  return {
    items,
    nextCursor: cursorFrom(nested) ?? cursorFrom(raw),
  };
}

async function fetchPages(
  url: string,
  params: { feedId: string; commentId?: string },
): Promise<unknown[]> {
  const items: unknown[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const res = await bffGet<BffEnvelope<unknown>>(url, {
      ...params,
      size: PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    });
    const unpacked = unwrapPage(res.data ?? res);
    items.push(...unpacked.items);
    if (!unpacked.nextCursor || unpacked.items.length === 0) break;
    cursor = unpacked.nextCursor;
  }
  return items;
}

/** 피드 댓글 시트용. 답글이 목록에 없으면 답글 API를 이어서 조회 */
export async function loadFeedComments(feedId: string): Promise<MockComment[]> {
  const rows = await fetchPages(bffEndpoints.feeds.comments, { feedId });
  const mapped = rows
    .map(mapComment)
    .filter((v): v is { comment: MockComment; fetchReplies: boolean } => v != null);

  await Promise.all(
    mapped.map(async ({ comment, fetchReplies }) => {
      if (!fetchReplies) return;
      const replies = await fetchPages(bffEndpoints.feeds.replies, {
        feedId,
        commentId: comment.id,
      });
      comment.replies = replies
        .map(mapReply)
        .filter((v): v is MockCommentReply => v != null);
    }),
  );

  return mapped.map((row) => row.comment);
}

/** 댓글 작성. 저장된 댓글을 시트 항목으로 돌려준다 */
export async function createFeedComment(
  feedId: string,
  content: string,
): Promise<MockComment | null> {
  const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.feeds.comments, {
    feedId,
    content,
  });
  return mapComment(res.data ?? res)?.comment ?? null;
}

export async function updateFeedComment(feedId: string, commentId: string, content: string) {
  await bffPatchJson<BffEnvelope<unknown>>(bffEndpoints.feeds.comment, {
    feedId,
    commentId,
    content,
  });
}

export async function deleteFeedComment(feedId: string, commentId: string) {
  await bffDelete<BffEnvelope<unknown>>(bffEndpoints.feeds.comment, { feedId, commentId });
}

/** 답글 작성 */
export async function createFeedReply(
  feedId: string,
  commentId: string,
  content: string,
): Promise<MockCommentReply | null> {
  const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.feeds.replies, {
    feedId,
    commentId,
    content,
  });
  return mapReply(res.data ?? res);
}

export async function updateFeedReply(
  feedId: string,
  commentId: string,
  replyId: string,
  content: string,
) {
  await bffPatchJson<BffEnvelope<unknown>>(bffEndpoints.feeds.reply, {
    feedId,
    commentId,
    replyId,
    content,
  });
}

export async function deleteFeedReply(feedId: string, commentId: string, replyId: string) {
  await bffDelete<BffEnvelope<unknown>>(bffEndpoints.feeds.reply, {
    feedId,
    commentId,
    replyId,
  });
}
