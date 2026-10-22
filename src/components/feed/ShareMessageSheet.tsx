'use client';

import { AccountSearchList } from '@/components/common/AccountSearchList';
import { MediaImage } from '@/components/common/MediaImage';
import { SendStateIcon } from '@/components/common/SendStateIcon';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { showFooterNotice } from '@/lib/ui/footerNotice';
import type { BffEnvelope } from '@/types/api';
import clsx from 'clsx';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './ShareMessageSheet.module.scss';

const MY_PROFILE = '/images/mock/post2.jpg';
const CLOSE_DRAG_PX = 90;

type ShareTarget = {
  userNo: number;
  nickname: string;
  imageUrl: string;
  petTags: string[];
  dmRoomId: number | null;
  following: boolean;
  followedBy: boolean;
  group: number;
  activeAt: string;
};

export type ShareTargetPriority = 'DM' | 'OWN_STORY_TAG' | 'OWN_FEED_TAG';

type ShareMessageSheetProps = {
  open: boolean;
  onClose: () => void;
  feedId: string;
  feedMediaId: number | null;
  /** Optional permutation of the first three priority groups. */
  priorityOrder?: readonly ShareTargetPriority[];
};

/** 게시글 공유 — 공유 대상을 골라 메시지로 보낸다 */
export function ShareMessageSheet({
  open,
  onClose,
  feedId,
  feedMediaId,
  priorityOrder,
}: ShareMessageSheetProps) {
  const [hydrated, setHydrated] = useState(false);
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [exitY, setExitY] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const startYRef = useRef(0);
  const dragYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const presentRef = useRef(false);
  const openRef = useRef(open);
  openRef.current = open;

  const [rows, setRows] = useState<ShareTarget[]>([]);
  const [listStatus, setListStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [selectedUserNo, setSelectedUserNo] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const priorityKey = priorityOrder?.join(',') ?? '';
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setDraft('');
    setSelectedUserNo(null);
    setQuery('');
    setRows([]);
    setListStatus('loading');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setRows([]);
        setListStatus('loading');
        try {
          const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.dm.shareTargets, {
            limit: 50,
            q: query,
            ...(priorityKey ? { priorityOrder: priorityKey } : {}),
          });
          if (cancelled) return;
          setRows(readShareTargets(res.data));
          setListStatus('ready');
        } catch (err) {
          console.error('[share-message] targets failed', err);
          if (!cancelled) {
            setRows([]);
            setListStatus('error');
          }
        }
      },
      query.trim() ? 250 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, priorityKey]);

  const animateClose = useCallback(() => {
    if (closingRef.current || !presentRef.current) return;
    closingRef.current = true;
    setDragging(false);
    const height = sheetRef.current?.offsetHeight ?? window.innerHeight;
    setExitY(Math.max(dragYRef.current, height));
    setShown(false);
  }, []);

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
    if (openRef.current) onClose();
  }

  function onSheetTransitionEnd(event: ReactTransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== 'transform') return;
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

  function onHandlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (closingRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startYRef.current = event.clientY;
    dragYRef.current = 0;
    setDragging(true);
  }

  function onHandlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dy = Math.max(0, event.clientY - startYRef.current);
    dragYRef.current = dy;
    setDragY(dy);
  }

  function onHandlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    finishDrag();
  }

  async function submitMessage(event?: FormEvent) {
    event?.preventDefault();
    const target = rows.find((row) => row.userNo === selectedUserNo);
    if (!target || !canMessage(target) || sending) return;
    const body = draft.trim();
    setSending(true);
    try {
      let roomId = target.dmRoomId != null ? String(target.dmRoomId) : '';
      if (!roomId) {
        const roomRes = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.rooms, {
          targetUserNo: target.userNo,
        });
        roomId = readRoomId(roomRes.data);
      }
      if (!roomId) throw new Error('room missing');
      const payload: Record<string, string | number> = {
        roomId,
        feedId: Number(feedId),
      };
      if (body) payload.body = body;
      if (feedMediaId != null) payload.feedMediaId = feedMediaId;
      await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.messages, payload);
      showFooterNotice('메시지를 보냈습니다.');
      setDraft('');
      animateClose();
    } catch (err) {
      console.error('[share-message] send failed', err);
      showFooterNotice('메시지를 보내지 못했습니다.');
    } finally {
      setSending(false);
    }
  }

  if (!hydrated || !present) return null;

  const translateY = shown ? `${dragY}px` : exitY != null ? `${exitY}px` : '100%';

  return createPortal(
    <div className={styles.root} role="presentation">
      <button
        type="button"
        className={clsx(styles.dim, shown && styles.dimShow)}
        aria-label="메시지 보내기 닫기"
        onClick={animateClose}
      />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="메시지로 보내기"
        style={{
          transform: `translate(-50%, ${translateY})`,
          transition: dragging ? 'none' : undefined,
        }}
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

        <AccountSearchList
          items={rows}
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setSelectedUserNo(null);
            setRows([]);
            setListStatus('loading');
          }}
          onSelect={(row) => setSelectedUserNo(row.userNo)}
          selectedUserNo={selectedUserNo}
          status={listStatus}
          serverSearch
          selection="radio"
          isDisabled={(row) => !canMessage(row)}
          getNote={(row) => (canMessage(row) ? undefined : '* 팔로우 관계가 아닙니다.')}
          disabled={sending}
        />

        <form className={styles.composer} onSubmit={(event) => void submitMessage(event)}>
          <div className={styles.composerRow}>
            <span className={styles.composerAvatar}>
              <MediaImage
                src={MY_PROFILE}
                alt=""
                width={32}
                height={32}
                className={styles.avatarImg}
              />
            </span>
            <input
              className={styles.composerInput}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="메시지를 입력하세요."
              aria-label="메시지 입력"
              disabled={selectedUserNo == null}
            />
            <button
              type="submit"
              className={styles.composerSend}
              disabled={selectedUserNo == null || sending}
              aria-label="전송"
            >
              <SendStateIcon sending={sending} />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function canMessage(row: ShareTarget) {
  return row.dmRoomId != null || row.following || row.followedBy;
}

function readShareTargets(raw: unknown): ShareTarget[] {
  const list = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
      : [];
  const rows = list.flatMap((item) => {
    if (!isRecord(item) || typeof item.userNo !== 'number') return [];
    const nickname = typeof item.nickname === 'string' ? item.nickname.trim() : '';
    if (!nickname) return [];
    return [
      {
        userNo: item.userNo,
        nickname,
        imageUrl: resolveFileDisplayUrl(asFile(item.profileFile)) ?? NO_PROFILE_SRC,
        dmRoomId: readRoomNumber(item.dmRoomId),
        following: item.following === true,
        followedBy: item.followedBy === true,
        petTags: Array.isArray(item.petTags)
          ? item.petTags.flatMap((tag) => {
              const name = typeof tag === 'string' ? tag.trim().replace(/^@+/, '') : '';
              return name ? [`@${name}`] : [];
            })
          : [],
        group: typeof item.group === 'number' ? item.group : 9,
        activeAt: typeof item.activeAt === 'string' ? item.activeAt : '',
      },
    ];
  });
  const seen = new Set<number>();
  return rows.filter((row) => {
    if (seen.has(row.userNo)) return false;
    seen.add(row.userNo);
    return true;
  });
}

function readRoomNumber(raw: unknown) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() && Number.isFinite(Number(raw))) return Number(raw);
  return null;
}

function asFile(raw: unknown) {
  if (!isRecord(raw) || typeof raw.filePath !== 'string' || !raw.filePath.trim()) return null;
  return {
    fileId: typeof raw.fileId === 'number' ? raw.fileId : 0,
    filePath: raw.filePath,
  };
}

function readRoomId(raw: unknown) {
  if (!isRecord(raw)) return '';
  const value = raw.dmRoomId ?? raw.roomId;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}
