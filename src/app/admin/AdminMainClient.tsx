'use client';

import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, useTransition, type RefObject } from 'react';
import styles from './admin.module.scss';

type TagRequest = {
  requestId: number;
  hashtag: string;
  title: string;
  status: string;
  createdAt: string;
  requesterUserNo: number | null;
  requesterNickname: string | null;
};

type ReportItem = {
  reportId: number;
  headline: string;
  detail: string;
  status: string;
  createdAt: string;
};

type TagOrigin = {
  mode: 'pending' | 'rest';
  cursor?: number;
};

type ReportOrigin = {
  cursor?: number;
};

const TAG_STATUS: Record<string, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

const REPORT_STATUS: Record<string, string> = {
  REQUESTED: '신고요청',
  CONFIRMED: '확인',
  DELETED: '삭제조치',
  REJECTED: '거절',
  ON_HOLD: '보류',
  SUSPENDED: '정지',
};

const REPORT_REASON: Record<string, string> = {
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

const STATUS_TONE: Record<string, string> = {
  PENDING: 'toneWait',
  REQUESTED: 'toneWait',
  APPROVED: 'toneOk',
  CONFIRMED: 'toneCheck',
  ON_HOLD: 'toneHold',
  REJECTED: 'toneNo',
  DELETED: 'toneNo',
  SUSPENDED: 'toneStop',
};

const TARGET_TYPE: Record<string, string> = {
  USER: '회원',
  FEED: '게시글',
  COMMENT: '댓글',
  REPLY: '답글',
};

const API_LIMIT = 50;
const ROW_FALLBACK = 78;

export default function AdminMainClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const tagListRef = useRef<HTMLDivElement>(null);
  const reportListRef = useRef<HTMLDivElement>(null);

  const [tags, setTags] = useState<TagRequest[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [tagState, setTagState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reportState, setReportState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tagPage, setTagPage] = useState(0);
  const [reportPage, setReportPage] = useState(0);
  const [tagOrigins, setTagOrigins] = useState<TagOrigin[]>([{ mode: 'pending' }]);
  const [reportOrigins, setReportOrigins] = useState<ReportOrigin[]>([{}]);
  const [tagNext, setTagNext] = useState<TagOrigin | null>(null);
  const [reportNext, setReportNext] = useState<ReportOrigin | null>(null);
  const tagPageSize = useFitCount(tagListRef, tags.length);
  const reportPageSize = useFitCount(reportListRef, reports.length);
  const [tagFit, setTagFit] = useState(tagPageSize);
  const [reportFit, setReportFit] = useState(reportPageSize);

  if (tagFit !== tagPageSize) {
    setTagFit(tagPageSize);
    setTagPage(0);
    setTagOrigins([{ mode: 'pending' }]);
  }
  if (reportFit !== reportPageSize) {
    setReportFit(reportPageSize);
    setReportPage(0);
    setReportOrigins([{}]);
  }

  useEffect(() => {
    let cancelled = false;
    const origin = tagOrigins[tagPage] ?? { mode: 'pending' as const };
    (async () => {
      try {
        const page = await loadTagPage(origin, tagPageSize);
        if (cancelled) return;
        setTags(page.items);
        setTagNext(page.next);
        setTagState('ready');
      } catch (err) {
        console.error('[admin] tag requests', err);
        if (!cancelled) setTagState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tagPage, tagOrigins, tagPageSize]);

  useEffect(() => {
    let cancelled = false;
    const origin = reportOrigins[reportPage] ?? {};
    (async () => {
      try {
        const page = await loadReportPage(origin, reportPageSize);
        if (cancelled) return;
        setReports(page.items);
        setReportNext(page.next);
        setReportState('ready');
      } catch (err) {
        console.error('[admin] reports', err);
        if (!cancelled) setReportState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportPage, reportOrigins, reportPageSize]);

  const onLogout = () => {
    setLogoutError(null);
    startTransition(async () => {
      try {
        await bffPostJson(bffEndpoints.admin.logout);
      } catch (err) {
        console.error('[admin logout]', err);
        setLogoutError('로그아웃 요청에 실패했습니다.');
      }
      router.replace('/admin');
      router.refresh();
    });
  };

  const goTagNext = () => {
    if (!tagNext) return;
    const next = tagNext;
    setTagOrigins((prev) => {
      const existing = prev[tagPage + 1];
      if (existing && sameTagOrigin(existing, next)) return prev;
      return [...prev.slice(0, tagPage + 1), next];
    });
    setTagPage((page) => page + 1);
  };

  const goReportNext = () => {
    if (!reportNext) return;
    const next = reportNext;
    setReportOrigins((prev) => {
      const existing = prev[reportPage + 1];
      if (existing && existing.cursor === next.cursor) return prev;
      return [...prev.slice(0, reportPage + 1), next];
    });
    setReportPage((page) => page + 1);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.logoutBar}>
        <button type="button" className={styles.logoutButton} onClick={onLogout} disabled={pending}>
          {pending ? '로그아웃 중…' : '로그아웃'}
        </button>
      </div>
      {logoutError ? <p className={styles.logoutError}>{logoutError}</p> : null}
      <div className={styles.board}>
        <section className={styles.pane}>
          <h1 className={styles.paneTitle}>태그</h1>
          {tagState === 'loading' && tags.length === 0 ? <p className={styles.empty}>불러오는 중</p> : null}
          {tagState === 'error' ? <p className={styles.empty}>태그 목록을 불러오지 못했습니다.</p> : null}
          {tagState === 'ready' && tags.length === 0 ? <p className={styles.empty}>요청이 없습니다.</p> : null}
          <div ref={tagListRef} className={styles.listWrap}>
            <ul className={styles.list}>
              {tags.map((item) => (
                <li
                  key={item.requestId}
                  className={item.status === 'APPROVED' ? `${styles.row} ${styles.settled}` : styles.row}
                >
                  <span className={styles.rowMain}>
                    <span className={styles.rowBody}>
                      <span className={styles.rowName}>#{item.hashtag}</span>
                      {item.title ? <span className={styles.rowMeta}>{item.title}</span> : null}
                      {item.requesterUserNo != null ? (
                        <span className={styles.rowMeta}>
                          {memberLabel(item.requesterUserNo, item.requesterNickname)}
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.rowSide}>
                      <span className={badgeClass(item.status)}>{TAG_STATUS[item.status] ?? item.status}</span>
                      {item.createdAt ? <span className={styles.rowWhen}>{formatWhen(item.createdAt)}</span> : null}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Pager
            page={tagPage}
            hasNext={tagNext != null}
            disabled={tagState === 'loading'}
            onPrev={() => setTagPage((page) => Math.max(0, page - 1))}
            onNext={goTagNext}
          />
        </section>
        <section className={styles.pane}>
          <h1 className={styles.paneTitle}>신고</h1>
          {reportState === 'loading' && reports.length === 0 ? (
            <p className={styles.empty}>불러오는 중</p>
          ) : null}
          {reportState === 'error' ? <p className={styles.empty}>신고 목록을 불러오지 못했습니다.</p> : null}
          {reportState === 'ready' && reports.length === 0 ? (
            <p className={styles.empty}>신고가 없습니다.</p>
          ) : null}
          <div ref={reportListRef} className={styles.listWrap}>
            <ul className={styles.list}>
              {reports.map((item) => (
                <li
                  key={item.reportId}
                  className={item.status !== 'REQUESTED' ? `${styles.row} ${styles.settled}` : styles.row}
                >
                  <span className={styles.rowMain}>
                    <span className={styles.rowBody}>
                      <span className={styles.rowName}>{item.headline}</span>
                      <span className={styles.rowMeta}>{item.detail}</span>
                    </span>
                    <span className={styles.rowSide}>
                      <span className={`${badgeClass(item.status)} ${styles.badgeReport}`}>
                        {REPORT_STATUS[item.status] ?? item.status}
                      </span>
                      {item.createdAt ? <span className={styles.rowWhen}>{formatWhen(item.createdAt)}</span> : null}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Pager
            page={reportPage}
            hasNext={reportNext != null}
            disabled={reportState === 'loading'}
            onPrev={() => setReportPage((page) => Math.max(0, page - 1))}
            onNext={goReportNext}
          />
        </section>
      </div>
    </div>
  );
}

function badgeClass(status: string) {
  const tone = STATUS_TONE[status];
  return tone ? `${styles.badge} ${styles[tone]}` : styles.badge;
}

function Pager({
  page,
  hasNext,
  disabled,
  onPrev,
  onNext,
}: {
  page: number;
  hasNext: boolean;
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={styles.pager}>
      <button type="button" className={styles.pageButton} onClick={onPrev} disabled={disabled || page === 0}>
        이전
      </button>
      <span className={styles.pageLabel}>{page + 1}</span>
      <button type="button" className={styles.pageButton} onClick={onNext} disabled={disabled || !hasNext}>
        다음
      </button>
    </div>
  );
}

function useFitCount(ref: RefObject<HTMLDivElement | null>, itemCount: number) {
  const [count, setCount] = useState(8);
  const rowHeight = useRef(ROW_FALLBACK);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const sample = el.querySelector('li');
      if (sample) {
        const height = sample.getBoundingClientRect().height;
        if (height > 0) rowHeight.current = height;
      }
      const next = Math.max(1, Math.min(API_LIMIT, Math.floor(el.clientHeight / rowHeight.current)));
      setCount((prev) => (prev === next ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, itemCount]);

  return count;
}

function sameTagOrigin(a: TagOrigin, b: TagOrigin) {
  return a.mode === b.mode && a.cursor === b.cursor;
}

async function loadTagPage(origin: TagOrigin, pageSize: number) {
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

async function loadReportPage(origin: ReportOrigin, pageSize: number) {
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
  };
}

async function fetchPage<T>(
  url: string,
  params: Record<string, string | number>,
  cursorField: string,
  read: (raw: unknown) => T[],
) {
  const res = await bffGet<BffEnvelope<unknown>>(url, params);
  const unpacked = unwrapPage(res.data, cursorField);
  return { items: read(unpacked.items), nextCursor: unpacked.nextCursor };
}

function unwrapPage(raw: unknown, cursorField: string): { items: unknown[]; nextCursor: number | null } {
  if (Array.isArray(raw)) return { items: raw, nextCursor: null };
  if (!isRecord(raw)) return { items: [], nextCursor: null };
  const items = Array.isArray(raw.items) ? raw.items : [];
  const cursor = raw[cursorField];
  const nextCursor =
    typeof cursor === 'number' && cursor > 0
      ? cursor
      : typeof cursor === 'string' && /^\d+$/.test(cursor.trim())
        ? Number(cursor.trim())
        : null;
  return { items, nextCursor };
}

function readTagRequests(raw: unknown): TagRequest[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.flatMap((item) => {
    if (!isRecord(item) || typeof item.requestId !== 'number') return [];
    const hashtag = typeof item.hashtag === 'string' ? item.hashtag.trim().replace(/^#/, '') : '';
    if (!hashtag) return [];
    return [
      {
        requestId: item.requestId,
        hashtag,
        title: typeof item.title === 'string' ? item.title.trim() : '',
        status: typeof item.status === 'string' ? item.status : '',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
        requesterUserNo: typeof item.requesterUserNo === 'number' ? item.requesterUserNo : null,
        requesterNickname: typeof item.requesterNickname === 'string' ? item.requesterNickname.trim() : null,
      },
    ];
  });
}

function readReports(raw: unknown): ReportItem[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.flatMap((item) => {
    if (!isRecord(item) || typeof item.reportId !== 'number') return [];
    const targetType = typeof item.targetType === 'string' ? item.targetType : '';
    const typeLabel = TARGET_TYPE[targetType] ?? targetType;
    const reason = REPORT_REASON[typeof item.reason === 'string' ? item.reason : ''] ?? (typeof item.reason === 'string' ? item.reason : '');
    const nickname = typeof item.targetNickname === 'string' ? item.targetNickname.trim() : '';
    const content = typeof item.targetContent === 'string' ? item.targetContent.trim() : '';
    const userNo = typeof item.targetUserNo === 'number' ? item.targetUserNo : null;
    const headline =
      targetType === 'USER' && userNo != null
        ? memberLabel(userNo, nickname || null)
        : content || typeLabel;
    return [
      {
        reportId: item.reportId,
        headline,
        detail: [typeLabel, reason].filter(Boolean).join(' '),
        status: typeof item.status === 'string' ? item.status : '',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
      },
    ];
  });
}

function memberLabel(userNo: number, nickname: string | null) {
  return nickname ? `no.${userNo}(${nickname})` : `no.${userNo}`;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
}
