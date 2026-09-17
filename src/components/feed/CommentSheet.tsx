'use client';

import {
  MOCK_FEED_COMMENTS,
  type MockComment,
  type MockCommentReply,
} from '@/lib/mock/comments';
import clsx from 'clsx';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './CommentSheet.module.scss';

const CLOSE_DRAG_PX = 50;
const COMMENT_HISTORY_KEY = 'ultaryCommentSheet';
const COMMENT_QUERY = 'comments';

function commentSheetUrl(feedId: string, withQuery: boolean) {
  const url = new URL(window.location.href);
  if (withQuery) url.searchParams.set(COMMENT_QUERY, feedId);
  else url.searchParams.delete(COMMENT_QUERY);
  return `${url.pathname}${url.search}${url.hash}`;
}

function stripCommentQuery(feedId: string) {
  const url = new URL(window.location.href);
  if (url.searchParams.get(COMMENT_QUERY) !== feedId) return;
  const prev =
    history.state && typeof history.state === 'object'
      ? { ...(history.state as object) }
      : {};
  history.replaceState(
    { ...prev, [COMMENT_HISTORY_KEY]: null },
    '',
    commentSheetUrl(feedId, false),
  );
}

type CommentSheetProps = {
  open: boolean;
  onClose: () => void;
  feedId: string;
  comments?: MockComment[];
};

function renderContent(content: string) {
  const parts = content.split(/(@[A-Za-z0-9_]+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className={styles.mention}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function CommentBody({
  item,
  compact,
}: {
  item: MockCommentReply;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsMore, setNeedsMore] = useState(false);
  const [liked, setLiked] = useState(Boolean(item.isLiked));
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;

    const measure = () => {
      setNeedsMore(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [item.content, item.nickname, expanded]);

  return (
    <div className={clsx(styles.item, compact && styles.itemReply)}>
      <span className={clsx(styles.avatarWrap, compact && styles.avatarWrapSm)}>
        <Image
          src={item.profileUrl}
          alt=""
          width={compact ? 32 : 40}
          height={compact ? 32 : 40}
          className={styles.avatar}
        />
      </span>

      <div className={styles.body}>
        <div className={styles.textWrap}>
          <p
            ref={textRef}
            className={clsx(styles.text, !expanded && styles.textClamped)}
          >
            <strong className={styles.nick}>{item.nickname}</strong>{' '}
            {renderContent(item.content)}
          </p>
          {!expanded && needsMore ? (
            <span className={styles.moreFade}>
              <button
                type="button"
                className={styles.more}
                onClick={() => setExpanded(true)}
              >
                ...더보기
              </button>
            </span>
          ) : null}
        </div>
        <div className={styles.meta}>
          <span className={styles.time}>{item.timeLabel}</span>
          <button type="button" className={styles.replyBtn}>
            답글 달기
          </button>
        </div>
      </div>

      <button
        type="button"
        className={clsx(styles.likeBtn, liked && styles.likeBtnOn)}
        aria-label={`좋아요 ${likeCount}`}
        aria-pressed={liked}
        onClick={() => {
          setLiked((v) => !v);
          setLikeCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
        }}
      >
        <Heart
          className={styles.likeIcon}
          size={18}
          strokeWidth={1.75}
          fill={liked ? 'currentColor' : 'none'}
          aria-hidden
        />
        <span className={styles.likeCount}>{likeCount}</span>
      </button>
    </div>
  );
}

/** 게시글 댓글·답글 바텀시트 */
export function CommentSheet({
  open,
  onClose,
  feedId,
  comments = MOCK_FEED_COMMENTS,
}: CommentSheetProps) {
  const [hydrated, setHydrated] = useState(false);
  /** 포털 유지 (닫힘 애니 끝날 때까지) */
  const [present, setPresent] = useState(false);
  /** 열린 위치(드래그 오프셋 포함) vs 화면 밖 */
  const [shown, setShown] = useState(false);
  const [dragY, setDragY] = useState(0);
  /** 닫힐 때 목표 Y (현재 드래그 위치 → 시트 높이, px) */
  const [exitY, setExitY] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const presentRef = useRef(false);
  const openRef = useRef(open);
  openRef.current = open;
  const historyPushedRef = useRef(false);
  const closedByPopRef = useRef(false);
  const ignorePopRef = useRef(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const animateClose = useCallback(() => {
    if (closingRef.current || !presentRef.current) return;
    closingRef.current = true;
    setDragging(false);
    const height = sheetRef.current?.offsetHeight ?? window.innerHeight;
    // 손 놓은 위치에서 이어서 아래로
    setExitY(Math.max(dragYRef.current, height));
    setShown(false);
  }, []);

  /** 모바일 뒤로가기 = 시트만 닫히도록 history 엔트리 추가 */
  useEffect(() => {
    if (!open) return;

    const url = new URL(window.location.href);
    const alreadyOpen = url.searchParams.get(COMMENT_QUERY) === feedId;
    const state =
      history.state && typeof history.state === 'object'
        ? { ...(history.state as object) }
        : {};

    if (!alreadyOpen) {
      history.pushState(
        { ...state, [COMMENT_HISTORY_KEY]: feedId },
        '',
        commentSheetUrl(feedId, true),
      );
      historyPushedRef.current = true;
    } else {
      historyPushedRef.current =
        (history.state as { [COMMENT_HISTORY_KEY]?: string } | null)?.[
          COMMENT_HISTORY_KEY
        ] === feedId;
    }

    const onPopState = () => {
      if (ignorePopRef.current) return;
      closedByPopRef.current = true;
      historyPushedRef.current = false;
      animateClose();
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [open, feedId, animateClose]);

  useEffect(() => {
    if (!open) {
      animateClose();
      return;
    }

    closingRef.current = false;
    presentRef.current = true;
    setExitY(null);
    setPresent(true);
    setShown(false);
    setDragY(0);
    dragYRef.current = 0;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setShown(true));
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, [open, animateClose]);

  function finishClose() {
    presentRef.current = false;
    setPresent(false);
    setDragY(0);
    dragYRef.current = 0;
    setExitY(null);
    closingRef.current = false;

    const byPop = closedByPopRef.current;
    closedByPopRef.current = false;
    const shouldBack = historyPushedRef.current && !byPop;
    historyPushedRef.current = false;

    if (openRef.current) onClose();

    if (shouldBack) {
      ignorePopRef.current = true;
      history.back();
      queueMicrotask(() => {
        ignorePopRef.current = false;
      });
    } else if (!byPop) {
      stripCommentQuery(feedId);
    }
  }

  function onSheetTransitionEnd(e: ReactTransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (shown) return;
    finishClose();
  }

  const finishDrag = useCallback(() => {
    setDragging(false);
    if (dragYRef.current >= CLOSE_DRAG_PX) {
      animateClose();
      return;
    }
    setDragY(0);
    dragYRef.current = 0;
  }, [animateClose]);

  function onHandlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (closingRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startYRef.current = e.clientY;
    dragYRef.current = 0;
    setDragging(true);
  }

  function onHandlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dy = Math.max(0, e.clientY - startYRef.current);
    dragYRef.current = dy;
    setDragY(dy);
  }

  function onHandlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    finishDrag();
  }

  if (!hydrated || !present) return null;

  const translateY = shown
    ? `${dragY}px`
    : exitY != null
      ? `${exitY}px`
      : '100%';

  return createPortal(
    <div className={styles.root} role="presentation">
      <button
        type="button"
        className={clsx(styles.dim, shown && styles.dimShow)}
        aria-label="댓글 닫기"
        onClick={animateClose}
      />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="댓글"
        style={{
          transform: `translate(-50%, ${translateY})`,
          transition: dragging ? 'none' : undefined,
        }}
        data-feed-id={feedId}
        onTransitionEnd={onSheetTransitionEnd}
      >
        <div
          className={styles.drag}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <span className={styles.bar} aria-hidden />
        </div>

        <div className={styles.list}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.thread}>
              <CommentBody item={comment} />
              {comment.replies.length > 0 ? (
                <div className={styles.replies}>
                  {comment.replies.map((reply) => (
                    <CommentBody key={reply.id} item={reply} compact />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
