import { nicknameTag } from '@/lib/nickname-tag';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import { readTagRequest, type TagRequest } from './tagRequestData';

export type ReportItem = {
  reportId: number;
  headline: string;
  detail: string;
  status: string;
  createdAt: string;
  processedAt: string;
  targetType: string;
  reason: string;
  reporterUserNo: number | null;
  reporterNickname: string;
  targetUserNo: number | null;
  targetFeedId: number | null;
  targetCommentId: number | null;
  targetReplyId: number | null;
  targetNickname: string;
  targetContent: string;
  targetSuspended: boolean;
};

export type TagOrigin = {
  mode: 'pending' | 'rest';
  cursor?: number;
};

export type ReportOrigin = {
  cursor?: number;
};

export const TAG_STATUS: Record<string, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

export const REPORT_STATUS: Record<string, string> = {
  REQUESTED: '요청',
  CONFIRMED: '확인',
  DELETED: '삭제조치',
  REJECTED: '거절',
  ON_HOLD: '보류',
  SUSPENDED: '정지',
};

export const REPORT_REASON: Record<string, string> = {
  SPAM: '스팸·광고',
  ABUSE: '욕설·비방',
  HARASSMENT: '괴롭힘',
  SEXUAL: '음란',
  VIOLENCE: '폭력',
  HATE: '혐오',
  IMPERSONATION: '사칭',
  PRIVACY: '개인정보',
  OTHER: '기타',
};

export const STATUS_TONE: Record<string, string> = {
  PENDING: 'toneWait',
  REQUESTED: 'toneWait',
  APPROVED: 'toneOk',
  CONFIRMED: 'toneCheck',
  ON_HOLD: 'toneHold',
  REJECTED: 'toneNo',
  DELETED: 'toneNo',
  SUSPENDED: 'toneStop',
};

export const TARGET_TYPE: Record<string, string> = {
  USER: '회원',
  FEED: '게시글',
  COMMENT: '댓글',
  REPLY: '답글',
};

export const API_LIMIT = 50;

export function sameTagOrigin(a: TagOrigin, b: TagOrigin) {
  return a.mode === b.mode && a.cursor === b.cursor;
}

export async function loadTagPage(origin: TagOrigin, pageSize: number) {
  if (origin.mode === 'pending') {
    const pending = await fetchPage(
      bffEndpoints.admin.tagProfileRequests,
      {
        status: 'PENDING',
        limit: pageSize,
        ...(origin.cursor != null ? { cursorRequestId: origin.cursor } : {}),
      },
      'nextCursorRequestId',
      readTagRequests,
    );
    if (pending.items.length >= pageSize) {
      if (pending.nextCursor != null) {
        return {
          items: pending.items.slice(0, pageSize),
          next: { mode: 'pending' as const, cursor: pending.nextCursor },
        };
      }
      const rest = await takeSettledTags(undefined, 1);
      return {
        items: pending.items.slice(0, pageSize),
        next: rest.items.length > 0 ? { mode: 'rest' as const } : null,
      };
    }
    const rest = await takeSettledTags(undefined, pageSize - pending.items.length);
    return { items: [...pending.items, ...rest.items], next: rest.next };
  }
  return takeSettledTags(origin.cursor, pageSize);
}

async function takeSettledTags(cursor: number | undefined, need: number) {
  const items: TagRequest[] = [];
  let current = cursor;
  for (let guard = 0; guard < 20 && items.length < need; guard += 1) {
    const page = await fetchPage(
      bffEndpoints.admin.tagProfileRequests,
      {
        limit: API_LIMIT,
        ...(current != null ? { cursorRequestId: current } : {}),
      },
      'nextCursorRequestId',
      readTagRequests,
    );
    const others = page.items.filter((item) => item.status !== 'PENDING');
    const room = need - items.length;
    if (others.length > room) {
      const taken = others.slice(0, room);
      items.push(...taken);
      return { items, next: { mode: 'rest' as const, cursor: taken[taken.length - 1].requestId } };
    }
    items.push(...others);
    if (items.length >= need) {
      return {
        items,
        next: page.nextCursor != null ? { mode: 'rest' as const, cursor: page.nextCursor } : null,
      };
    }
    if (page.nextCursor == null) return { items, next: null };
    current = page.nextCursor;
  }
  const last = items[items.length - 1];
  return { items, next: last ? { mode: 'rest' as const, cursor: last.requestId } : null };
}

export async function loadReportPage(origin: ReportOrigin, pageSize: number) {
  const page = await fetchPage(
    bffEndpoints.admin.reports,
    {
      limit: pageSize,
      ...(origin.cursor != null ? { cursorReportId: origin.cursor } : {}),
    },
    'nextCursorReportId',
    readReports,
  );
  return {
    items: page.items,
    next: page.nextCursor != null ? { cursor: page.nextCursor } : null,
    totalCount: page.totalCount,
  };
}

export async function fetchTagTotalCount() {
  try {
    const page = await fetchPage(
      bffEndpoints.admin.tagProfileRequests,
      { limit: 1 },
      'nextCursorRequestId',
      readTagRequests,
    );
    return page.totalCount;
  } catch (err) {
    console.error('[admin] tag total', err);
    return null;
  }
}

export async function findReport(reportId: number) {
  return findInPages(reportId, async (cursor) => {
    const page = await fetchPage(
      bffEndpoints.admin.reports,
      { limit: API_LIMIT, ...(cursor != null ? { cursorReportId: cursor } : {}) },
      'nextCursorReportId',
      readReports,
    );
    return { items: page.items, nextCursor: page.nextCursor };
  }, (item) => item.reportId);
}

async function findInPages<T>(
  id: number,
  load: (cursor: number | null) => Promise<{ items: T[]; nextCursor: number | null }>,
  idOf: (item: T) => number,
) {
  let cursor: number | null = null;
  for (let guard = 0; guard < 40; guard += 1) {
    const page = await load(cursor);
    const found = page.items.find((item) => idOf(item) === id);
    if (found) return found;
    if (page.nextCursor == null) return null;
    cursor = page.nextCursor;
  }
  return null;
}

async function fetchPage<T>(
  url: string,
  params: Record<string, string | number>,
  cursorField: string,
  read: (raw: unknown) => T[],
) {
  const res = await bffGet<BffEnvelope<unknown>>(url, params);
  const unpacked = unwrapPage(res.data, cursorField);
  return { items: read(unpacked.items), nextCursor: unpacked.nextCursor, totalCount: unpacked.totalCount };
}

function unwrapPage(
  raw: unknown,
  cursorField: string,
): { items: unknown[]; nextCursor: number | null; totalCount: number | null } {
  if (Array.isArray(raw)) return { items: raw, nextCursor: null, totalCount: null };
  if (!isRecord(raw)) return { items: [], nextCursor: null, totalCount: null };
  const items = Array.isArray(raw.items) ? raw.items : [];
  const cursor = raw[cursorField];
  const nextCursor =
    typeof cursor === 'number' && cursor > 0
      ? cursor
      : typeof cursor === 'string' && /^\d+$/.test(cursor.trim())
        ? Number(cursor.trim())
        : null;
  return { items, nextCursor, totalCount: readCount(raw.totalCount) };
}

function readCount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.trunc(value);
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

function readTagRequests(raw: unknown): TagRequest[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.flatMap((item) => {
    if (!isRecord(item)) return [];
    const request = readTagRequest(item);
    return request ? [request] : [];
  });
}

function readReports(raw: unknown): ReportItem[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.flatMap((item) => {
    if (!isRecord(item) || typeof item.reportId !== 'number') return [];
    const targetType = typeof item.targetType === 'string' ? item.targetType : '';
    const typeLabel = TARGET_TYPE[targetType] ?? targetType;
    const reasonCode = typeof item.reason === 'string' ? item.reason : '';
    const reason = REPORT_REASON[reasonCode] ?? reasonCode;
    const nickname = typeof item.targetNickname === 'string' ? item.targetNickname.trim() : '';
    const content = typeof item.targetContent === 'string' ? item.targetContent.trim() : '';
    const userNo = typeof item.targetUserNo === 'number' ? item.targetUserNo : null;
    const body = targetType === 'USER' && userNo != null ? memberLabel(userNo, nickname || null) : content;
    return [
      {
        reportId: item.reportId,
        headline: reason ? `${typeLabel} / ${reason}` : typeLabel,
        detail: body,
        status: typeof item.status === 'string' ? item.status : '',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
        processedAt: typeof item.processedAt === 'string' ? item.processedAt : '',
        targetType,
        reason: reasonCode,
        reporterUserNo: typeof item.reporterUserNo === 'number' ? item.reporterUserNo : null,
        reporterNickname: typeof item.reporterNickname === 'string' ? item.reporterNickname : '',
        targetUserNo: userNo,
        targetFeedId: typeof item.targetFeedId === 'number' ? item.targetFeedId : null,
        targetCommentId: typeof item.targetCommentId === 'number' ? item.targetCommentId : null,
        targetReplyId: typeof item.targetReplyId === 'number' ? item.targetReplyId : null,
        targetNickname: nickname,
        targetContent: content,
        targetSuspended: item.targetSuspended === true,
      },
    ];
  });
}

export function memberLabel(userNo: number, nickname: string | null) {
  return nickname ? `no.${userNo}(${nicknameTag(nickname)})` : `no.${userNo}`;
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
}
