'use client';
import { useResettableState } from '@/lib/react/useResettableState';

import { PageLoadError } from '@/components/common/PageLoadError';

import { AccountSearchList } from '@/components/common/AccountSearchList';
import { useRankedAccounts, type RankedAccount } from '@/lib/search/useRankedAccounts';
import { EmptyState } from '@/components/common/EmptyState';
import { RevealTime } from '@/components/common/RevealTime';
import { FooterMenu } from '@/components/common/FooterMenu';
import { MediaImage } from '@/components/common/MediaImage';
import { PageHeader } from '@/components/common/PageHeader';
import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { subscribeDmMessage, subscribeDmRead, subscribeDmTyping } from '@/lib/ws/liveSocket';
import { clearDmRoomUnread } from '@/lib/dm/unreadBadge';
import type { BffEnvelope } from '@/types/api';
import type { FileSummary } from '@/types/file';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, useMemo } from 'react';
import styles from './dm.module.scss';
import { DmRoomActions } from './DmRoomActions';

const SendIcon = '/images/icon/Send.svg';

type PendingShare =
  { kind: 'feed'; feedId: string; feedMediaId?: string } | { kind: 'story'; storyId: string };

type FollowLink = {
  following: boolean;
  followedBy: boolean;
};

type DmRoom = {
  id: string;
  peerUserNo: string;
  nickname: string;
  profileUrl: string;
  lastMessage: string;
  timeLabel: string;
  absoluteLabel: string;
  unread: number;
  link: FollowLink | null;
};

type DmShareCard = {
  type: 'FEED' | 'STORY';
  available: boolean;
  fileUrl: string | null;
  authorNickname: string;
  authorProfileUrl: string;
  authorStory: StoryStatus;
  content: string;
  feedId: string | null;
  storyId: string | null;
  /** 스토리 주인. 있으면 그 유저 목록에서 연다 */
  ownerUserNo: string | null;
  /** 0이 첫 장 */
  mediaIndex: number | null;
  feedMediaId: string | null;
};

type DmMessage = {
  id: string;
  fromMe: boolean;
  senderUserNo: string | null;
  body: string;
  timeLabel: string;
  absoluteLabel: string;
  /** 보낸 시각의 분. 같은 분이면 맨 아래 말풍선만 시각을 보여 준다 */
  minuteKey: string;
  share: DmShareCard | null;
};

type DmClientProps = {
  roomId?: string;
  feedId?: string;
  feedMediaId?: string;
  storyId?: string;
};

function initialShare(props: DmClientProps): PendingShare | null {
  if (props.feedId) {
    return { kind: 'feed', feedId: props.feedId, feedMediaId: props.feedMediaId };
  }
  if (props.storyId) return { kind: 'story', storyId: props.storyId };
  return null;
}

function shareSearch(share: PendingShare | null) {
  const params = new URLSearchParams();
  if (share?.kind === 'feed') {
    params.set('feedId', share.feedId);
    if (share.feedMediaId) params.set('feedMediaId', share.feedMediaId);
  } else if (share?.kind === 'story') {
    params.set('storyId', share.storyId);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

function idString(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

function unwrapItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  return [];
}

function asFile(raw: unknown): Pick<FileSummary, 'fileId' | 'filePath'> | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.filePath !== 'string' || !raw.filePath.trim()) return null;
  return {
    fileId: typeof raw.fileId === 'number' ? raw.fileId : 0,
    filePath: raw.filePath,
  };
}

function minuteKeyOf(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day} ${hh}:${mm}`;
}

function formatDmTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff >= 0) {
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return '방금 전';
    if (minutes <= 30) return `${minutes}분 전`;
  }
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startToday - startThat) / 86_400_000);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (dayDiff === 0) return `${hh}:${mm}`;
  if (dayDiff === 1) return '어제';
  if (dayDiff === 2) return '2일전';
  if (dayDiff === 3) return '3일전';
  const clock = `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
  if (date.getFullYear() === now.getFullYear()) return clock;
  return `${date.getFullYear()}년 ${clock}`;
}

function formatDmAbsolute(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const clock = `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
  if (date.getFullYear() === new Date().getFullYear()) return clock;
  return `${date.getFullYear()}년 ${clock}`;
}

function pickErrorMessage(err: unknown, fallback: string) {
  if (isHttpError(err) && isRecord(err.data)) {
    const detail = err.data.detail;
    const message = err.data.message;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function readLink(raw: unknown): FollowLink | null {
  if (!isRecord(raw) || typeof raw.following !== 'boolean' || typeof raw.followedBy !== 'boolean') {
    return null;
  }
  return { following: raw.following, followedBy: raw.followedBy };
}

function unlinked(link: FollowLink | null | undefined) {
  return link != null && !link.following && !link.followedBy;
}

function mapRoom(raw: unknown): DmRoom | null {
  if (!isRecord(raw)) return null;
  const id = idString(raw.dmRoomId) ?? idString(raw.roomId);
  const peerUserNo = idString(raw.peerUserNo);
  if (!id || !peerUserNo) return null;
  const nickname = (typeof raw.peerNickname === 'string' && raw.peerNickname.trim()) || '사용자';
  const lastMessage = typeof raw.lastMessage === 'string' ? raw.lastMessage : '';
  const when = typeof raw.lastMessageAt === 'string' ? raw.lastMessageAt : '';
  const unread = typeof raw.unreadCount === 'number' ? raw.unreadCount : 0;
  return {
    id,
    peerUserNo,
    nickname,
    profileUrl: resolveFileDisplayUrl(asFile(raw.profileFile)) ?? NO_PROFILE_SRC,
    lastMessage,
    timeLabel: when ? formatDmTime(when) : '',
    absoluteLabel: when ? formatDmAbsolute(when) : '',
    unread: unread > 0 ? Math.floor(unread) : 0,
    link: readLink(raw),
  };
}

function mapShare(raw: unknown, message: Record<string, unknown>): DmShareCard | null {
  if (!isRecord(raw) || (raw.type !== 'FEED' && raw.type !== 'STORY')) return null;
  const available = raw.available !== false;
  return {
    type: raw.type,
    available,
    fileUrl: available ? (resolveFileDisplayUrl(asFile(raw.file)) ?? null) : null,
    authorNickname: (typeof raw.authorNickname === 'string' && raw.authorNickname.trim()) || '',
    authorProfileUrl: resolveFileDisplayUrl(asFile(raw.authorProfileFile)) ?? NO_PROFILE_SRC,
    authorStory:
      raw.authorHasStory === true ? (raw.authorHasUnviewed === false ? 'read' : 'unread') : 'none',
    content: available && typeof raw.content === 'string' ? raw.content.trim() : '',
    feedId: idString(raw.feedId) ?? idString(message.feedId),
    storyId: idString(raw.storyId) ?? idString(message.storyId),
    ownerUserNo: idString(raw.userNo) ?? idString(raw.authorUserNo),
    mediaIndex: readMediaIndex(raw.mediaIndex) ?? readMediaIndex(message.mediaIndex),
    feedMediaId: idString(raw.feedMediaId) ?? idString(message.feedMediaId),
  };
}

function readPeerReadId(data: unknown) {
  if (!isRecord(data)) return null;
  return idString(data.peerLastReadMessageId);
}

function peerHasRead(readId: string | null, messageId: string) {
  if (!readId) return false;
  const read = Number(readId);
  const message = Number(messageId);
  if (!Number.isFinite(read) || !Number.isFinite(message)) return false;
  return read >= message;
}

function readMediaIndex(value: unknown) {
  const index = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(index) || index < 0) return null;
  return Math.floor(index);
}

function mapMessage(raw: unknown): DmMessage | null {
  if (!isRecord(raw)) return null;
  const id = idString(raw.dmMessageId) ?? idString(raw.messageId);
  if (!id) return null;
  const when = typeof raw.createdAt === 'string' ? raw.createdAt : '';
  return {
    id,
    fromMe: raw.fromMe === true,
    senderUserNo: idString(raw.senderUserNo),
    body: typeof raw.body === 'string' ? raw.body : '',
    timeLabel: when ? formatDmTime(when) : '',
    absoluteLabel: when ? formatDmAbsolute(when) : '',
    minuteKey: when ? minuteKeyOf(when) : '',
    share: mapShare(raw.share, raw),
  };
}

function ShareCard({ share }: { share: DmShareCard }) {
  if (!share.available || !share.fileUrl) return null;
  const storyParams = new URLSearchParams();
  if (share.ownerUserNo) storyParams.set('userNo', share.ownerUserNo);
  if (share.authorNickname) storyParams.set('nickname', share.authorNickname);
  const ownerStoryHref = `/stories?${new URLSearchParams({
    ...Object.fromEntries(storyParams),
    single: '1',
  }).toString()}`;
  const params = new URLSearchParams();
  if (share.mediaIndex != null && share.mediaIndex > 0) {
    params.set('mediaIndex', String(share.mediaIndex));
  } else if (share.feedMediaId) params.set('feedMediaId', share.feedMediaId);
  const query = params.toString();
  const contentHref =
    share.type === 'STORY'
      ? share.storyId
        ? `/stories/${share.storyId}?${storyParams.toString()}`
        : null
      : share.feedId
        ? `/posts/${share.feedId}${query ? `?${query}` : ''}`
        : null;
  const avatar = (
    <Profile
      imageUrl={share.authorProfileUrl}
      size={28}
      story={share.authorStory}
      className={styles.shareAvatar}
      onError={(event) => {
        event.currentTarget.src = NO_PROFILE_SRC;
      }}
    />
  );
  const content = (
    <>
      {share.fileUrl ? (
        <MediaImage
          src={share.fileUrl}
          alt=""
          width={180}
          height={180}
          className={styles.shareImage}
        />
      ) : null}
      {share.type === 'FEED' && share.content ? (
        <p className={styles.shareContent}>{share.content}</p>
      ) : null}
    </>
  );
  return (
    <div className={share.type === 'STORY' ? styles.shareStory : styles.shareFeed}>
      {share.type === 'FEED' ? (
        <span className={styles.shareAuthor}>
          {share.authorStory !== 'none' && share.ownerUserNo ? (
            <Link
              href={ownerStoryHref}
              className={styles.shareAuthorAvatar}
              aria-label={`${share.authorNickname} 스토리 보기`}
            >
              {avatar}
            </Link>
          ) : (
            <span className={styles.shareAuthorAvatar}>{avatar}</span>
          )}
          {share.authorNickname ? (
            <Link href={myUltaryPath(share.authorNickname)} className={styles.shareAuthorName}>
              {share.authorNickname}
            </Link>
          ) : null}
        </span>
      ) : null}
      {contentHref ? (
        <Link href={contentHref} className={styles.shareContentLink}>
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}

/** 메시지(DM) — 방 목록 + 스레드 */
export default function DmClient({ roomId, feedId, feedMediaId, storyId }: DmClientProps) {
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
  const router = useRouter();
  const [rooms, setRooms] = useState<DmRoom[]>([]);
  const [status, setStatus] = useState('불러오는 중');
  const [messages, setMessages] = useResettableState<DmMessage[]>([], [roomId]);
  const [peerReadMessageId, setPeerReadMessageId] = useResettableState<string | null>(null, [
    roomId,
  ]);
  const [peerTyping, setPeerTyping] = useResettableState(false, [roomId]);
  const [olderCursor, setOlderCursor] = useResettableState<string | null>(null, [roomId]);
  const [threadStatus, setThreadStatus] = useResettableState(roomId ? '불러오는 중' : '', [roomId]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [picking, setPicking] = useState(false);
  const [peerStatus, setPeerStatus] = useState('');
  const [peerQuery, setPeerQuery] = useState('');
  const [peerOpening, setPeerOpening] = useState(false);
  const [pendingPeer, setPendingPeer] = useState<RankedAccount | null>(null);
  const peerList = useRankedAccounts('DM', picking, peerQuery);
  const [pendingShare, setPendingShare] = useState<PendingShare | null>(() =>
    initialShare({ feedId, feedMediaId, storyId }),
  );
  const [threadLink, setThreadLink] = useResettableState<FollowLink | null>(null, [roomId]);
  const [peerProfile, setPeerProfile] = useState<{
    userNo: string;
    nickname: string;
    imageUrl: string;
    story: StoryStatus;
  } | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const threadReqRef = useRef(0);
  const socketEpochRef = useRef(0);
  const sendBusyRef = useRef(false);
  const removedRoomsRef = useRef(new Set<string>());

  const active = useMemo(
    () =>
      roomId
        ? (rooms.find((room) => room.id === roomId) ?? {
            id: roomId,
            peerUserNo: '',
            nickname: '',
            profileUrl: NO_PROFILE_SRC,
            lastMessage: '',
            timeLabel: '',
            absoluteLabel: '',
            unread: 0,
            link: null,
          })
        : pendingPeer
          ? {
              id: '',
              peerUserNo: String(pendingPeer.userNo),
              nickname: pendingPeer.nickname,
              profileUrl: pendingPeer.imageUrl,
              lastMessage: '',
              timeLabel: '',
              absoluteLabel: '',
              unread: 0,
              link: { following: pendingPeer.following, followedBy: pendingPeer.followedBy },
            }
          : null,
    [roomId, rooms, pendingPeer],
  );

  const activePeerUserNo = active?.peerUserNo;
  useEffect(() => {
    if (!activePeerUserNo) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.ultary, {
          userNo: activePeerUserNo,
        });
        if (cancelled || !isRecord(res.data)) return;
        const data = res.data;
        const story: StoryStatus =
          data.hasStory === true ? (data.hasUnviewed === false ? 'read' : 'unread') : 'none';
        setPeerProfile({
          userNo: activePeerUserNo,
          nickname: typeof data.nickname === 'string' ? data.nickname : '',
          imageUrl: resolveFileDisplayUrl(data.profileFile as FileSummary | null) ?? NO_PROFILE_SRC,
          story,
        });
      } catch (err) {
        if (!cancelled) console.error('[dm] peer profile failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePeerUserNo]);

  useEffect(() => {
    let cancelled = false;
    const epoch = socketEpochRef.current;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.dm.rooms, { limit: 30 });
        if (cancelled) return;
        const loaded = unwrapItems(res.data)
          .map(mapRoom)
          .filter((room): room is DmRoom => room != null && !removedRoomsRef.current.has(room.id));
        setRooms((prev) => {
          if (socketEpochRef.current === epoch) return loaded;
          const seen = new Set<string>();
          const ordered: DmRoom[] = [];
          for (const room of prev) {
            if (seen.has(room.id)) continue;
            seen.add(room.id);
            ordered.push(room);
          }
          for (const room of loaded) {
            if (seen.has(room.id)) continue;
            seen.add(room.id);
            ordered.push(room);
          }
          return ordered;
        });
        setStatus('');
      } catch (err) {
        if (!cancelled) setStatus(pickErrorMessage(err, '메시지를 불러오지 못했습니다.'));
        if (!cancelled) setLoadFailed({ error: err });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active, messages.length, peerTyping]);

  async function loadMessages(roomId: string, beforeMessageId?: string) {
    const params: Record<string, string> = { roomId, limit: '30' };
    if (beforeMessageId) params.beforeMessageId = beforeMessageId;
    const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.dm.messages, params);
    const list = unwrapItems(res.data)
      .map(mapMessage)
      .filter((item): item is DmMessage => item != null);
    const cursor = isRecord(res.data) ? idString(res.data.nextCursorMessageId) : null;
    return { list, cursor, peerRead: readPeerReadId(res.data), link: readLink(res.data) };
  }

  useEffect(() => {
    if (!roomId) return;
    const req = ++threadReqRef.current;

    let cancelled = false;
    (async () => {
      try {
        const { list, cursor, peerRead, link } = await loadMessages(roomId);
        if (cancelled || threadReqRef.current !== req) return;
        setPeerReadMessageId(peerRead);
        setThreadLink(link);
        if (link) {
          setRooms((prev) => prev.map((item) => (item.id === roomId ? { ...item, link } : item)));
        }
        setMessages((prev) => {
          const ids = new Set(list.map((item) => item.id));
          const extra = prev.filter((item) => !ids.has(item.id));
          return extra.length > 0 ? [...list, ...extra] : list;
        });
        setOlderCursor(cursor);
        setThreadStatus('');
        setRooms((prev) =>
          prev.map((item) => (item.id === roomId ? { ...item, unread: 0 } : item)),
        );
        clearDmRoomUnread(roomId);
      } catch (err) {
        if (cancelled || threadReqRef.current !== req) return;
        setLoadFailed({ error: err });
        setThreadStatus(pickErrorMessage(err, '대화를 불러오지 못했습니다.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, setMessages, setOlderCursor, setPeerReadMessageId, setThreadLink, setThreadStatus]);

  function markOpenRoomRead(id: string) {
    clearDmRoomUnread(id);
    setRooms((previous) =>
      previous.map((item) => (item.id === id ? { ...item, unread: 0 } : item)),
    );
    void bffPostJson(bffEndpoints.dm.roomRead, { roomId: id }).catch(() => undefined);
  }

  useEffect(() => {
    return subscribeDmMessage((event) => {
      socketEpochRef.current += 1;
      const room = mapRoom(event.room);
      if (room) {
        setRooms((prev) => [room, ...prev.filter((item) => item.id !== room.id)]);
      }
      if (!roomId || event.dmRoomId !== roomId) return;
      const message = mapMessage(event.message);
      if (message && !message.fromMe) {
        markOpenRoomRead(roomId);
      }
      if (!message) return;
      setMessages((prev) =>
        prev.some((item) => item.id === message.id) ? prev : [...prev, message],
      );
    });
  }, [roomId, setMessages]);

  useEffect(() => {
    return subscribeDmRead((event) => {
      if (!roomId || event.dmRoomId !== roomId) return;
      setPeerReadMessageId(event.lastReadMessageId);
    });
  }, [roomId, setPeerReadMessageId]);

  useEffect(() => {
    if (!roomId) return;
    setPeerTyping(false);
    let hideTimer: number | undefined;
    const stopHide = () => {
      if (hideTimer != null) window.clearTimeout(hideTimer);
      hideTimer = undefined;
    };
    const unsubscribe = subscribeDmTyping((event) => {
      if (event.dmRoomId !== roomId) return;
      if (!event.typing) {
        stopHide();
        setPeerTyping(false);
        return;
      }
      setPeerTyping(true);
      stopHide();
      hideTimer = window.setTimeout(() => setPeerTyping(false), 5000);
    });
    return () => {
      stopHide();
      unsubscribe();
    };
  }, [roomId, setPeerTyping]);

  useEffect(() => {
    if (!roomId) return;
    let stopped = false;
    const send = (viewing: boolean) => {
      void bffPostJson(bffEndpoints.dm.roomViewing, { roomId, viewing }).catch(() => undefined);
    };
    send(true);
    const timer = window.setInterval(() => {
      if (!stopped) send(true);
    }, 10_000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      send(false);
    };
  }, [roomId]);

  const composing = draft.trim().length > 0;

  useEffect(() => {
    if (!roomId || !composing) return;
    let stopped = false;
    const send = (typing: boolean) => {
      void bffPostJson(bffEndpoints.dm.roomTyping, { roomId, typing }).catch(() => undefined);
    };
    send(true);
    const timer = window.setInterval(() => {
      if (!stopped) send(true);
    }, 2500);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      send(false);
    };
  }, [roomId, composing]);

  function openRoom(room: DmRoom) {
    router.push(`/dm/${room.id}${shareSearch(pendingShare)}`);
  }

  async function loadOlder() {
    if (!active || !olderCursor || threadStatus) return;
    setThreadStatus('이전 메시지');
    try {
      const { list, cursor } = await loadMessages(active.id, olderCursor);
      setMessages((prev) => [...list, ...prev]);
      setOlderCursor(cursor);
      setThreadStatus('');
    } catch (err) {
      setThreadStatus(pickErrorMessage(err, '이전 메시지를 불러오지 못했습니다.'));
    }
  }

  async function openPeer(peer: RankedAccount) {
    if (peerOpening) return;
    if (!peer.dmRoomId) {
      setPendingPeer(peer);
      setPicking(false);
      setDraft('');
      setMessages([]);
      setOlderCursor(null);
      setPeerReadMessageId(null);
      setThreadLink(null);
      setPeerTyping(false);
      setThreadStatus('');
      return;
    }
    setPeerOpening(true);
    setPeerStatus('');
    try {
      const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.rooms, {
        targetUserNo: Number(peer.userNo),
      });
      const room = mapRoom(res.data) ?? {
        id: idString(isRecord(res.data) ? (res.data.dmRoomId ?? res.data.roomId) : null) ?? '',
        peerUserNo: String(peer.userNo),
        nickname: peer.nickname,
        profileUrl: peer.imageUrl,
        lastMessage: '',
        timeLabel: '',
        absoluteLabel: '',
        unread: 0,
        link: readLink(res.data),
      };
      if (!room.id) throw new Error('대화방을 만들지 못했습니다.');
      setPicking(false);
      router.push(`/dm/${room.id}${shareSearch(pendingShare)}`);
    } catch (err) {
      setPeerStatus(pickErrorMessage(err, '대화를 시작하지 못했습니다.'));
    } finally {
      setPeerOpening(false);
    }
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    if (!active || sendBusyRef.current) return;
    const body = draft.trim();
    if (!body && !pendingShare) return;
    sendBusyRef.current = true;
    setSending(true);
    setThreadStatus('');
    try {
      const payload: Record<string, string | number> = { roomId: active.id };
      if (body) payload.body = body;
      if (pendingShare?.kind === 'feed') {
        payload.feedId = Number(pendingShare.feedId);
        if (pendingShare.feedMediaId) payload.feedMediaId = Number(pendingShare.feedMediaId);
      } else if (pendingShare?.kind === 'story') {
        payload.storyId = Number(pendingShare.storyId);
      }
      if (!roomId && pendingPeer) {
        delete payload.roomId;
        payload.targetUserNo = pendingPeer.userNo;
        const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.start, payload);
        const data = isRecord(res.data) ? res.data : null;
        const createdRoom = mapRoom(data?.room);
        if (!createdRoom) throw new Error('대화방 정보를 불러오지 못했습니다.');
        setRooms((previous) => [
          createdRoom,
          ...previous.filter((room) => room.id !== createdRoom.id),
        ]);
        setDraft('');
        setPendingShare(null);
        router.replace(`/dm/${createdRoom.id}`);
        return;
      }
      const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.messages, payload);
      const created = mapMessage(res.data);
      if (created) {
        setMessages((prev) =>
          prev.some((item) => item.id === created.id) ? prev : [...prev, created],
        );
      }
      setRooms((prev) =>
        prev.map((room) =>
          room.id === active.id
            ? {
                ...room,
                lastMessage:
                  body ||
                  (pendingShare?.kind === 'story' ? '스토리를 공유했습니다' : '') ||
                  (pendingShare?.kind === 'feed' ? '게시글을 공유했습니다' : room.lastMessage),
                timeLabel: created?.timeLabel || '방금 전',
                absoluteLabel: created?.absoluteLabel || formatDmAbsolute(new Date().toISOString()),
              }
            : room,
        ),
      );
      setDraft('');
      if (pendingShare) {
        setPendingShare(null);
        router.replace(`/dm/${active.id}`);
      }
    } catch (err) {
      setThreadStatus(pickErrorMessage(err, '메시지를 보내지 못했습니다.'));
    } finally {
      sendBusyRef.current = false;
      setSending(false);
    }
  }

  const removeRoom = (deletedId: string) => {
    removedRoomsRef.current.add(deletedId);
    socketEpochRef.current += 1;
    setRooms((previous) => previous.filter((item) => item.id !== deletedId));
    clearDmRoomUnread(deletedId);
    if (deletedId === roomId) {
      threadReqRef.current += 1;
      setMessages([]);
      setPendingPeer(null);
      setPendingShare(null);
      setDraft('');
      setThreadStatus('');
      router.replace('/dm');
    }
  };

  if (active) {
    const canSend = draft.trim().length > 0 || pendingShare != null;
    const headerProfile = peerProfile?.userNo === active.peerUserNo ? peerProfile : null;
    const peerNickname = headerProfile?.nickname || active.nickname;
    const peerStory = headerProfile?.story ?? 'none';
    const avatar = (
      <Profile
        imageUrl={headerProfile?.imageUrl ?? active.profileUrl}
        size={38}
        story={peerStory}
        onError={(event) => {
          event.currentTarget.src = NO_PROFILE_SRC;
        }}
      />
    );
    const lastReadOwnMessageId = messages.reduce<string | null>(
      (lastId, message) =>
        !message.fromMe ? null : peerHasRead(peerReadMessageId, message.id) ? message.id : lastId,
      null,
    );
    return (
      <div className={styles.shell}>
        <PageHeader
          titleAlign="start"
          title={
            <span className={styles.threadPeer}>
              {peerStory !== 'none' && active.peerUserNo ? (
                <Link
                  href={`/stories?${new URLSearchParams({ userNo: active.peerUserNo, nickname: peerNickname, single: '1' }).toString()}`}
                  className={styles.threadPeerAvatar}
                  aria-label={`${peerNickname} 스토리 보기`}
                >
                  {avatar}
                </Link>
              ) : (
                <span className={styles.threadPeerAvatar}>{avatar}</span>
              )}
              {peerNickname ? (
                <Link href={myUltaryPath(peerNickname)} className={styles.threadPeerName}>
                  {peerNickname}
                </Link>
              ) : (
                <span className={styles.threadPeerName}>메시지</span>
              )}
            </span>
          }
          onBack={() => {
            if (sendBusyRef.current) return;
            setPendingPeer(null);
            setDraft('');
            setThreadStatus('');
            if (roomId) router.replace(`/dm${shareSearch(pendingShare)}`);
          }}
          right={
            active.id ? (
              <DmRoomActions
                roomId={active.id}
                nickname={peerNickname}
                onDeleted={removeRoom}
                disabled={sending}
              />
            ) : null
          }
        />
        {unlinked(threadLink ?? active.link) ? (
          <p className={styles.relationBanner}>* 팔로우 관계가 아닙니다.</p>
        ) : null}
        <div className={styles.thread}>
          <div className={styles.messages}>
            {olderCursor ? (
              <button type="button" className={styles.older} onClick={() => void loadOlder()}>
                이전 메시지
              </button>
            ) : null}
            {threadStatus ? <p className={styles.status}>{threadStatus}</p> : null}
            {messages.map((message, index) => {
              const showRead = message.id === lastReadOwnMessageId;
              const next = messages[index + 1];
              const showTime =
                Boolean(message.timeLabel) &&
                (!message.minuteKey || !next || next.minuteKey !== message.minuteKey);
              return (
                <div
                  key={message.id}
                  className={clsx(styles.bubbleRow, message.fromMe && styles.bubbleRowMe)}
                >
                  <div className={styles.bubbleCol}>
                    <div className={clsx(styles.bubble, message.fromMe && styles.bubbleMe)}>
                      {message.share ? <ShareCard share={message.share} /> : null}
                      {message.body ? <p className={styles.bubbleText}>{message.body}</p> : null}
                      {message.share ? (
                        <span className={styles.bubbleShare}>
                          {message.share.type === 'STORY'
                            ? '스토리를 공유했습니다'
                            : '게시글을 공유했습니다'}
                        </span>
                      ) : null}
                    </div>
                    {showTime || showRead ? (
                      <div className={styles.bubbleMeta}>
                        {showRead ? <span className={styles.bubbleRead}>읽음</span> : null}
                        {showTime ? (
                          <RevealTime
                            label={message.timeLabel}
                            absolute={message.absoluteLabel}
                            className={styles.bubbleTime}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {peerTyping ? (
              <p className={styles.typing}>
                입력중
                <span className={styles.typingDots} aria-hidden>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </span>
              </p>
            ) : null}
            <div ref={threadEndRef} />
          </div>
          <form className={styles.composer} onSubmit={(event) => void sendMessage(event)}>
            {pendingShare ? (
              <p className={styles.pendingShare}>
                {pendingShare.kind === 'story' ? '스토리 사진' : '게시글 사진'}
              </p>
            ) : null}
            <input
              className={styles.composerInput}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="메시지를 입력하세요…"
              aria-label="메시지 입력"
            />
            <button
              type="submit"
              className={styles.composerSend}
              disabled={!canSend || sending}
              aria-label="전송"
            >
              <Image src={SendIcon} alt="" width={30} height={30} />
            </button>
          </form>
        </div>
        <div className={styles.threadFooter}>
          <FooterMenu />
        </div>
      </div>
    );
  }

  if (picking) {
    return (
      <div className={styles.shell}>
        <PageHeader title="대화 상대" onBack={() => setPicking(false)} />
        {peerStatus ? (
          <p className={styles.status} role="alert">
            {peerStatus}
          </p>
        ) : null}
        <AccountSearchList
          items={peerList.items}
          status={peerList.status}
          query={peerQuery}
          onQueryChange={(query) => {
            setPeerQuery(query);
            setPeerStatus('');
          }}
          onSelect={(peer) => void openPeer(peer)}
          serverSearch
          disabled={peerOpening}
          isDisabled={(peer) => !peer.following && !peer.followedBy}
          getNote={(peer) =>
            !peer.following && !peer.followedBy ? '* 팔로우 관계가 아닙니다.' : undefined
          }
        />
      </div>
    );
  }

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

  return (
    <div className={styles.shell}>
      <PageHeader
        title="메시지"
        hideBack
        right={
          <button
            type="button"
            className={styles.textBtn}
            onClick={() => {
              setPeerQuery('');
              setPeerStatus('');
              setPicking(true);
            }}
          >
            새 메시지
          </button>
        }
      />
      <main className={styles.main}>
        {pendingShare ? (
          <p className={styles.status}>
            {pendingShare.kind === 'story'
              ? '스토리를 보낼 대화를 고르세요.'
              : '게시글을 보낼 대화를 고르세요.'}
          </p>
        ) : null}
        {status ? <p className={styles.status}>{status}</p> : null}
        {!status && rooms.length === 0 ? (
          <EmptyState
            title="아직 메시지가 없어요"
            description="팔로우나 팔로워를 골라 대화를 시작할 수 있어요."
          />
        ) : (
          <ul className={styles.roomList}>
            {rooms.map((room) => (
              <li key={room.id} className={styles.roomBlock}>
                <div className={styles.roomRow}>
                  <button
                    type="button"
                    className={styles.roomItem}
                    onClick={() => void openRoom(room)}
                  >
                    <span className={styles.roomAvatar}>
                      <MediaImage
                        src={room.profileUrl}
                        alt=""
                        width={48}
                        height={48}
                        className={styles.roomAvatarImg}
                      />
                    </span>
                    <span className={styles.roomBody}>
                      <span className={styles.roomTop}>
                        <strong className={styles.roomNick}>{room.nickname}</strong>
                        <RevealTime
                          label={room.timeLabel}
                          absolute={room.absoluteLabel}
                          className={styles.roomTime}
                        />
                      </span>
                      <span className={styles.roomBottom}>
                        <span className={styles.roomPreview}>{room.lastMessage}</span>
                        {room.unread > 0 ? (
                          <span className={styles.badge}>{room.unread}</span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                  <DmRoomActions roomId={room.id} nickname={room.nickname} onDeleted={removeRoom} />
                </div>
                {unlinked(room.link) ? (
                  <p className={styles.relationNote}>* 팔로우 관계가 아닙니다.</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </main>
      <FooterMenu />
    </div>
  );
}
