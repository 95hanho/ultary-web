'use client';

import { loadMyUserNo } from '@/lib/auth/myUserNo';
import {
  createFeedComment,
  createFeedReply,
  deleteFeedComment,
  deleteFeedReply,
  loadFeedComments,
  updateFeedComment,
  updateFeedReply,
} from '@/lib/feed/toComments';
import {
  type MockComment,
  type MockCommentReply,
} from '@/lib/mock/comments';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { openReportModal, cancelReport, canCancelReport, type MyReport } from '@/lib/report/openReport';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { Ellipsis, Flag, Heart, Pencil, Trash2, X } from 'lucide-react';
import { MediaImage } from '@/components/common/MediaImage';
import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './CommentSheet.module.scss';

const CLOSE_DRAG_PX = 50;
const COMMENT_HISTORY_KEY = 'ultaryCommentSheet';
const COMMENT_QUERY = 'comments';
const MY_PROFILE = '/images/mock/post2.jpg';
const SendIcon = '/images/icon/Send.svg';

function commentSheetUrl(feedId: string, withQuery: boolean) {
  const url = new URL(window.location.href);
  if (withQuery) url.searchParams.set(COMMENT_QUERY, feedId);
  else url.searchParams.delete(COMMENT_QUERY);
  return `${url.pathname}${url.search}${url.hash}`;
}

function stripCommentQuery(feedId: string) {
  const url = new URL(window.location.href);
  if (url.searchParams.get(COMMENT_QUERY) !== feedId) return;
  url.searchParams.delete(COMMENT_QUERY);
  url.searchParams.delete('comment');
  url.searchParams.delete('reply');
  const prev =
    history.state && typeof history.state === 'object'
      ? { ...(history.state as object) }
      : {};
  history.replaceState(
    { ...prev, [COMMENT_HISTORY_KEY]: null },
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function commentFocusDomId(): string {
  const params = new URLSearchParams(window.location.search);
  const replyId = params.get('reply')?.trim();
  const commentId = params.get('comment')?.trim();
  if (replyId) return `reply-${replyId}`;
  if (commentId) return `comment-${commentId}`;
  return '';
}

type CommentSheetProps = {
  open: boolean;
  onClose: () => void;
  feedId: string;
  /** 넘기면 API 대신 이 목록을 쓴다 */
  comments?: MockComment[];
  /** 댓글 저장에 성공하면 피드 카드 수를 올린다. 답글은 글의 commentCount에 포함되지 않는다 */
  onCommentCreated?: () => void;
  /** 댓글 삭제에 성공하면 피드 카드 수를 내린다 */
  onCommentDeleted?: () => void;
};

type ThreadTarget = {
  kind: 'comment' | 'reply';
  id: string;
  parentCommentId: string;
};

function patchThreadReport(
  items: MockComment[],
  target: ThreadTarget,
  report: MyReport | null,
) {
  return items.map((comment) => {
    if (target.kind === 'comment') {
      return comment.id === target.id ? { ...comment, myReport: report } : comment;
    }
    if (comment.id !== target.parentCommentId) return comment;
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === target.id ? { ...reply, myReport: report } : reply,
      ),
    };
  });
}

function renderContent(content: string) {
  const parts = content.split(/(@[A-Za-z0-9_]+)/g);
  return parts.map((part, i) => {
    if (!part.startsWith('@')) {
      return <span key={i}>{part}</span>;
    }
    const nickname = part.slice(1);
    return (
      <Link
        key={i}
        href={myUltaryPath(nickname)}
        className={styles.mention}
      >
        {part}
      </Link>
    );
  });
}

function CommentBody({
  item,
  compact,
  parentCommentId,
  onReply,
  focused,
  menuOpen,
  onToggleMenu,
}: {
  item: MockCommentReply;
  compact?: boolean;
  parentCommentId: string;
  onReply: (nickname: string, parentCommentId: string) => void;
  focused?: boolean;
  menuOpen?: boolean;
  onToggleMenu: (anchor: HTMLButtonElement) => void;
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
    <div
      id={compact ? `reply-${item.id}` : `comment-${item.id}`}
      className={clsx(styles.item, compact && styles.itemReply, focused && styles.itemFocus)}
    >
      <Link
        href={myUltaryPath(item.nickname)}
        className={clsx(styles.avatarWrap, compact && styles.avatarWrapSm)}
      >
        <MediaImage
          src={item.profileUrl}
          alt=""
          width={compact ? 32 : 40}
          height={compact ? 32 : 40}
          className={styles.avatar}
        />
      </Link>

      <div className={styles.body}>
        <div className={styles.textWrap}>
          <p
            ref={textRef}
            className={clsx(styles.text, !expanded && styles.textClamped)}
          >
            <Link href={myUltaryPath(item.nickname)} className={styles.nick}>
              {item.nickname}
            </Link>{' '}
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
          <button
            type="button"
            className={styles.replyBtn}
            onClick={() => onReply(item.nickname, parentCommentId)}
          >
            답글 달기
          </button>
          <button
            type="button"
            className={styles.itemMoreBtn}
            aria-label={compact ? '답글 더보기' : '댓글 더보기'}
            aria-expanded={menuOpen}
            onClick={(event) => onToggleMenu(event.currentTarget)}
          >
            <Ellipsis size={14} strokeWidth={2} aria-hidden />
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
  comments,
  onCommentCreated,
  onCommentDeleted,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusDomId, setFocusDomId] = useState('');

  const [items, setItems] = useState<MockComment[]>(comments ?? []);
  const [listStatus, setListStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [myUserNo, setMyUserNo] = useState<number | null>(null);
  const openModal = useModalStore((s) => s.open);
  const [menu, setMenu] = useState<
    (ThreadTarget & { mine: boolean; anchor: DOMRect }) | null
  >(null);
  const [menuPlace, setMenuPlace] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<ThreadTarget | null>(null);
  const [replyTo, setReplyTo] = useState<{
    parentCommentId: string;
    nickname: string;
  } | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDraft('');
    setReplyTo(null);
    setEditing(null);
    setMenu(null);
    setFocusDomId(commentFocusDomId());

    if (comments) {
      setItems(comments);
      setListStatus('ready');
      return;
    }

    let cancelled = false;
    setItems([]);
    setListStatus('loading');
    loadFeedComments(feedId)
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setListStatus('ready');
      })
      .catch((err) => {
        console.error('[comments] load failed', err);
        if (cancelled) return;
        setItems([]);
        setListStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [open, comments, feedId]);

  useEffect(() => {
    let cancelled = false;
    void loadMyUserNo().then((userNo) => {
      if (!cancelled) setMyUserNo(userNo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const startReply = useCallback((nickname: string, parentCommentId: string) => {
    setEditing(null);
    setMenu(null);
    setReplyTo({ parentCommentId, nickname });
    setDraft((prev) => {
      const mention = `@${nickname} `;
      if (prev.startsWith(mention)) return prev;
      return mention;
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const clearReply = useCallback(() => {
    setReplyTo(null);
    setDraft('');
  }, []);

  const clearEdit = useCallback(() => {
    setEditing(null);
    setDraft('');
  }, []);

  async function submitComment(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const parentId = replyTo?.parentCommentId;
    const editingTarget = editing;
    setSending(true);
    try {
      if (editingTarget) {
        if (editingTarget.kind === 'reply') {
          await updateFeedReply(feedId, editingTarget.parentCommentId, editingTarget.id, text);
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingTarget.parentCommentId
                ? {
                    ...item,
                    replies: item.replies.map((reply) =>
                      reply.id === editingTarget.id ? { ...reply, content: text } : reply,
                    ),
                  }
                : item,
            ),
          );
        } else {
          await updateFeedComment(feedId, editingTarget.id, text);
          setItems((prev) =>
            prev.map((item) => (item.id === editingTarget.id ? { ...item, content: text } : item)),
          );
        }
        setDraft('');
        setEditing(null);
        return;
      }
      if (parentId) {
        const reply = await createFeedReply(feedId, parentId, text);
        if (!reply) throw new Error('empty reply');
        setItems((prev) =>
          prev.map((item) =>
            item.id === parentId ? { ...item, replies: [...item.replies, reply] } : item,
          ),
        );
      } else {
        const comment = await createFeedComment(feedId, text);
        if (!comment) throw new Error('empty comment');
        setItems((prev) => [...prev, comment]);
        onCommentCreated?.();
      }
      setDraft('');
      setReplyTo(null);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    } catch (err) {
      console.error('[comments] save failed', err);
    } finally {
      setSending(false);
    }
  }

  const toggleItemMenu = useCallback(
    (target: ThreadTarget, mine: boolean, anchor: HTMLButtonElement) => {
      setMenu((prev) => {
        if (prev && prev.kind === target.kind && prev.id === target.id) return null;
        return { ...target, mine, anchor: anchor.getBoundingClientRect() };
      });
      setMenuPlace(null);
    },
    [],
  );

  const beginEdit = useCallback(
    (target: ThreadTarget) => {
      const source =
        target.kind === 'reply'
          ? items
              .find((item) => item.id === target.parentCommentId)
              ?.replies.find((reply) => reply.id === target.id)
          : items.find((item) => item.id === target.id);
      if (!source) return;
      setMenu(null);
      setReplyTo(null);
      setEditing(target);
      setDraft(source.content);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [items],
  );

  const removeTarget = useCallback(
    (target: ThreadTarget) => {
      setMenu(null);
      const label = target.kind === 'reply' ? '답글' : '댓글';
      openModal({
        variant: 'confirm',
        title: '알림창',
        content: `이 ${label}을 삭제할까요?`,
        showCloseButton: true,
        okButton: {
          label: '삭제',
          tone: 'danger',
          onClick: () => {
            void (async () => {
              try {
                if (target.kind === 'reply') {
                  await deleteFeedReply(feedId, target.parentCommentId, target.id);
                  setItems((prev) =>
                    prev.map((item) =>
                      item.id === target.parentCommentId
                        ? {
                            ...item,
                            replies: item.replies.filter((reply) => reply.id !== target.id),
                          }
                        : item,
                    ),
                  );
                } else {
                  await deleteFeedComment(feedId, target.id);
                  setItems((prev) => prev.filter((item) => item.id !== target.id));
                  onCommentDeleted?.();
                }
                if (
                  editing &&
                  editing.kind === target.kind &&
                  editing.id === target.id
                ) {
                  setEditing(null);
                  setDraft('');
                }
              } catch (err) {
                console.error('[comments] delete failed', err);
                openModal({
                  variant: 'alert',
                  title: '알림창',
                  content: `${label}을 삭제하지 못했습니다.`,
                  showCloseButton: true,
                });
              }
            })();
          },
        },
      });
    },
    [editing, feedId, onCommentDeleted, openModal],
  );

  const reportTarget = useCallback((target: ThreadTarget) => {
    const targetId = Number(target.id);
    if (!Number.isFinite(targetId)) return;
    setMenu(null);
    openReportModal(
      {
        targetType: target.kind === 'reply' ? 'REPLY' : 'COMMENT',
        targetId,
      },
      (report) => {
        setItems((prev) => patchThreadReport(prev, target, report));
      },
    );
  }, []);

  const cancelTarget = useCallback(
    (target: ThreadTarget) => {
      const source =
        target.kind === 'reply'
          ? items
              .find((item) => item.id === target.parentCommentId)
              ?.replies.find((reply) => reply.id === target.id)
          : items.find((item) => item.id === target.id);
      if (!canCancelReport(source?.myReport)) return;
      const reportId = source.myReport.reportId;
      setMenu(null);
      void cancelReport(reportId)
        .then(() => setItems((prev) => patchThreadReport(prev, target, null)))
        .catch(() => undefined);
    },
    [items],
  );

  useLayoutEffect(() => {
    if (!menu) return;
    const el = menuRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const pad = 8;
    const gap = 6;
    let left = menu.anchor.right - box.width;
    if (left < pad) left = pad;
    if (left + box.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - pad - box.width);
    }
    let top = menu.anchor.bottom + gap;
    if (top + box.height > window.innerHeight - pad) {
      top = menu.anchor.top - box.height - gap;
    }
    setMenuPlace({ top: Math.max(pad, top), left });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  useLayoutEffect(() => {
    if (!open || listStatus !== 'ready' || !focusDomId) return;
    const el = document.getElementById(focusDomId);
    el?.scrollIntoView({ block: 'center' });
  }, [open, listStatus, focusDomId, items]);

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

  const menuSource = !menu
    ? null
    : menu.kind === 'comment'
      ? (items.find((item) => item.id === menu.id) ?? null)
      : (items
          .find((item) => item.id === menu.parentCommentId)
          ?.replies.find((reply) => reply.id === menu.id) ?? null);
  const reportCancel = canCancelReport(menuSource?.myReport);

  return (
    <>
    {createPortal(
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

        <div ref={listRef} className={styles.list}>
          {listStatus === 'loading' ? (
            <p className={styles.status}>댓글을 불러오는 중</p>
          ) : null}
          {listStatus === 'error' ? (
            <p className={styles.status}>댓글을 불러오지 못했습니다.</p>
          ) : null}
          {listStatus === 'ready' && items.length === 0 ? (
            <p className={styles.status}>댓글이 없습니다.</p>
          ) : null}
          {items.map((comment) => (
            <div key={comment.id} className={styles.thread}>
              <CommentBody
                item={comment}
                parentCommentId={comment.id}
                onReply={startReply}
                focused={focusDomId === `comment-${comment.id}`}
                menuOpen={menu?.kind === 'comment' && menu.id === comment.id}
                onToggleMenu={(anchor) =>
                  toggleItemMenu(
                    { kind: 'comment', id: comment.id, parentCommentId: comment.id },
                    myUserNo != null && comment.userNo === myUserNo,
                    anchor,
                  )
                }
              />
              {comment.replies.length > 0 ? (
                <div className={styles.replies}>
                  {comment.replies.map((reply) => (
                    <CommentBody
                      key={reply.id}
                      item={reply}
                      compact
                      parentCommentId={comment.id}
                      onReply={startReply}
                      focused={focusDomId === `reply-${reply.id}`}
                      menuOpen={menu?.kind === 'reply' && menu.id === reply.id}
                      onToggleMenu={(anchor) =>
                        toggleItemMenu(
                          { kind: 'reply', id: reply.id, parentCommentId: comment.id },
                          myUserNo != null && reply.userNo === myUserNo,
                          anchor,
                        )
                      }
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <form className={styles.composer} onSubmit={submitComment}>
          {editing ? (
            <div className={styles.replyBar}>
              <span className={styles.replyHint}>
                {editing.kind === 'reply' ? '답글' : '댓글'} 수정 중
              </span>
              <button
                type="button"
                className={styles.replyCancel}
                aria-label="수정 취소"
                onClick={clearEdit}
              >
                <X size={16} strokeWidth={2} aria-hidden />
              </button>
            </div>
          ) : null}
          {replyTo && !editing ? (
            <div className={styles.replyBar}>
              <span className={styles.replyHint}>
                <strong>@{replyTo.nickname}</strong>님에게 답글 남기는 중
              </span>
              <button
                type="button"
                className={styles.replyCancel}
                aria-label="답글 취소"
                onClick={clearReply}
              >
                <X size={16} strokeWidth={2} aria-hidden />
              </button>
            </div>
          ) : null}
          <div className={styles.composerRow}>
            <span className={styles.composerAvatar}>
              <MediaImage
                src={MY_PROFILE}
                alt=""
                width={32}
                height={32}
                className={styles.avatar}
              />
            </span>
            <input
              ref={inputRef}
              className={styles.composerInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                editing
                  ? '내용을 수정하세요…'
                  : replyTo
                    ? `@${replyTo.nickname}님에게 답글 남기기…`
                    : '댓글을 입력하세요…'
              }
              aria-label={replyTo ? '답글 입력' : '댓글 입력'}
            />
            <button
              type="submit"
              className={styles.composerSend}
              disabled={!draft.trim() || sending}
              aria-label="전송"
            >
              <Image src={SendIcon} alt="" width={22} height={22} />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )}
    {menu
      ? createPortal(
          <>
            <button
              type="button"
              className={styles.menuBackdrop}
              aria-label="메뉴 닫기"
              onClick={() => setMenu(null)}
            />
            <div
              ref={menuRef}
              className={styles.itemMenu}
              role="menu"
              style={
                menuPlace
                  ? { top: menuPlace.top, left: menuPlace.left }
                  : { visibility: 'hidden' }
              }
            >
              {menu.mine ? (
                <>
                  <button
                    type="button"
                    className={styles.itemMenuBtn}
                    role="menuitem"
                    onClick={() => beginEdit(menu)}
                  >
                    <span className={styles.itemMenuIcon}>
                      <Pencil size={22} strokeWidth={1.75} />
                    </span>
                    <span className={styles.itemMenuLabel}>수정</span>
                  </button>
                  <button
                    type="button"
                    className={styles.itemMenuBtn}
                    role="menuitem"
                    onClick={() => removeTarget(menu)}
                  >
                    <span className={styles.itemMenuIcon}>
                      <Trash2 size={22} strokeWidth={1.75} />
                    </span>
                    <span className={styles.itemMenuLabel}>삭제하기</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.itemMenuBtn}
                  role="menuitem"
                  onClick={() => (reportCancel ? cancelTarget(menu) : reportTarget(menu))}
                >
                  <span className={styles.itemMenuIcon}>
                    <Flag size={22} strokeWidth={1.75} />
                  </span>
                  <span className={styles.itemMenuLabel}>
                    {reportCancel ? '신고취소' : '신고하기'}
                  </span>
                </button>
              )}
            </div>
          </>,
          document.body,
        )
      : null}
    </>
  );
}
