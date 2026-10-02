'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { MediaImage } from '@/components/common/MediaImage';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { isHttpError, isRecord } from '@/lib/api/error';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope, MeResponse } from '@/types/api';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import styles from './dm.module.scss';

const SendIcon = '/images/icon/Send.svg';

type PendingShare =
  | { kind: 'feed'; feedId: string; feedMediaId?: string }
  | { kind: 'story'; storyId: string };

type DmRoom = {
  id: string;
  peerUserNo: string;
  nickname: string;
  profileUrl: string;
  lastMessage: string;
  timeLabel: string;
  unread: number;
};

type DmShareCard = {
  type: 'FEED' | 'STORY';
  available: boolean;
  fileUrl: string | null;
  authorNickname: string;
  authorProfileUrl: string;
  content: string;
  feedId: string | null;
  storyId: string | null;
};

type DmMessage = {
  id: string;
  fromMe: boolean;
  body: string;
  timeLabel: string;
  share: DmShareCard | null;
};

type Peer = {
  userNo: string;
  nickname: string;
  profileUrl: string;
};

type PeerTab = 'RESIDENTS' | 'NEIGHBORS';

type DmClientProps = {
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

function asFile(raw: unknown) {
  return isRecord(raw) ? raw : null;
}

function formatDmTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff >= 0 && diff < 60_000) return '방금';
  if (diff >= 0 && diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}분`;
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startToday - startThat) / 86_400_000);
  if (dayDiff === 0) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  if (dayDiff === 1) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
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

function mapRoom(raw: unknown): DmRoom | null {
  if (!isRecord(raw)) return null;
  const id = idString(raw.dmRoomId) ?? idString(raw.roomId);
  const peerUserNo = idString(raw.peerUserNo);
  if (!id || !peerUserNo) return null;
  const nickname =
    (typeof raw.peerNickname === 'string' && raw.peerNickname.trim()) || '이웃';
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
    unread: unread > 0 ? Math.floor(unread) : 0,
  };
}

function mapShare(raw: unknown, message: Record<string, unknown>): DmShareCard | null {
  if (!isRecord(raw) || (raw.type !== 'FEED' && raw.type !== 'STORY')) return null;
  const available = raw.available !== false;
  return {
    type: raw.type,
    available,
    fileUrl: available ? (resolveFileDisplayUrl(asFile(raw.file)) ?? null) : null,
    authorNickname:
      (typeof raw.authorNickname === 'string' && raw.authorNickname.trim()) || '',
    authorProfileUrl:
      resolveFileDisplayUrl(asFile(raw.authorProfileFile)) ?? NO_PROFILE_SRC,
    content: available && typeof raw.content === 'string' ? raw.content.trim() : '',
    feedId: idString(raw.feedId) ?? idString(message.feedId),
    storyId: idString(raw.storyId) ?? idString(message.storyId),
  };
}

function mapMessage(raw: unknown): DmMessage | null {
  if (!isRecord(raw)) return null;
  const id = idString(raw.dmMessageId) ?? idString(raw.messageId);
  if (!id) return null;
  const when = typeof raw.createdAt === 'string' ? raw.createdAt : '';
  return {
    id,
    fromMe: raw.fromMe === true,
    body: typeof raw.body === 'string' ? raw.body : '',
    timeLabel: when ? formatDmTime(when) : '',
    share: mapShare(raw.share, raw),
  };
}

function mapPeer(raw: unknown): Peer | null {
  if (!isRecord(raw)) return null;
  const userNo = idString(raw.userNo);
  if (!userNo) return null;
  const nickname = (typeof raw.nickname === 'string' && raw.nickname.trim()) || '이웃';
  return {
    userNo,
    nickname,
    profileUrl: resolveFileDisplayUrl(asFile(raw.profileFile)) ?? NO_PROFILE_SRC,
  };
}

function ShareCard({ share }: { share: DmShareCard }) {
  if (!share.available || share.type === 'STORY') {
    if (!share.fileUrl) return null;
    const image = (
      <MediaImage src={share.fileUrl} alt="" width={180} height={180} className={styles.shareImage} />
    );
    if (share.storyId) {
      return (
        <Link href={`/stories/${share.storyId}`} className={styles.shareStory}>
          {image}
        </Link>
      );
    }
    return <div className={styles.shareStory}>{image}</div>;
  }

  const body = (
    <div className={styles.shareFeed}>
      <span className={styles.shareAuthor}>
        <MediaImage
          src={share.authorProfileUrl}
          alt=""
          width={22}
          height={22}
          className={styles.shareAvatar}
        />
        <span>{share.authorNickname}</span>
      </span>
      {share.fileUrl ? (
        <MediaImage src={share.fileUrl} alt="" width={180} height={180} className={styles.shareImage} />
      ) : null}
      {share.content ? <p className={styles.shareContent}>{share.content}</p> : null}
    </div>
  );
  if (share.feedId) return <Link href={`/posts/${share.feedId}`}>{body}</Link>;
  return body;
}

/** 메시지(DM) — 방 목록 + 스레드 */
export default function DmClient({ feedId, feedMediaId, storyId }: DmClientProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<DmRoom[]>([]);
  const [status, setStatus] = useState('불러오는 중');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [threadStatus, setThreadStatus] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [picking, setPicking] = useState(false);
  const [peerTab, setPeerTab] = useState<PeerTab>('RESIDENTS');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peerStatus, setPeerStatus] = useState('');
  const [pendingShare, setPendingShare] = useState<PendingShare | null>(() =>
    initialShare({ feedId, feedMediaId, storyId }),
  );
  const threadEndRef = useRef<HTMLDivElement>(null);
  const meUserNoRef = useRef<string | null>(null);
  const threadReqRef = useRef(0);

  const active = rooms.find((room) => room.id === activeId) ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.dm.rooms, { limit: 30 });
        if (cancelled) return;
        setRooms(unwrapItems(res.data).map(mapRoom).filter((room): room is DmRoom => room != null));
        setStatus('');
      } catch (err) {
        if (!cancelled) setStatus(pickErrorMessage(err, '메시지를 불러오지 못했습니다.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active, messages.length]);

  useEffect(() => {
    if (!picking) return;
    let cancelled = false;
    (async () => {
      setPeerStatus('불러오는 중');
      setPeers([]);
      try {
        if (!meUserNoRef.current) {
          const me = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
          const userNo = idString(me.data?.userNo);
          if (!userNo) throw new Error('내 계정을 찾지 못했습니다.');
          meUserNoRef.current = userNo;
        }
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.neighbors, {
          userNo: meUserNoRef.current,
          type: peerTab,
        });
        if (cancelled) return;
        setPeers(unwrapItems(res.data).map(mapPeer).filter((peer): peer is Peer => peer != null));
        setPeerStatus('');
      } catch (err) {
        if (!cancelled) setPeerStatus(pickErrorMessage(err, '목록을 불러오지 못했습니다.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [picking, peerTab]);

  async function loadMessages(roomId: string, beforeMessageId?: string) {
    const params: Record<string, string> = { roomId, limit: '30' };
    if (beforeMessageId) params.beforeMessageId = beforeMessageId;
    const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.dm.messages, params);
    const list = unwrapItems(res.data).map(mapMessage).filter((item): item is DmMessage => item != null);
    const cursor = isRecord(res.data) ? idString(res.data.nextCursorMessageId) : null;
    return { list, cursor };
  }

  async function openRoom(room: DmRoom) {
    const req = ++threadReqRef.current;
    setActiveId(room.id);
    setDraft('');
    setThreadStatus('불러오는 중');
    setMessages([]);
    setOlderCursor(null);
    setRooms((prev) => prev.map((item) => (item.id === room.id ? { ...item, unread: 0 } : item)));
    try {
      const { list, cursor } = await loadMessages(room.id);
      if (threadReqRef.current !== req) return;
      setMessages(list);
      setOlderCursor(cursor);
      setThreadStatus('');
    } catch (err) {
      if (threadReqRef.current !== req) return;
      setThreadStatus(pickErrorMessage(err, '대화를 불러오지 못했습니다.'));
    }
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

  async function openPeer(peer: Peer) {
    setPeerStatus('');
    try {
      const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.rooms, {
        targetUserNo: Number(peer.userNo),
      });
      const room = mapRoom(res.data) ?? {
        id: idString(isRecord(res.data) ? res.data.dmRoomId ?? res.data.roomId : null) ?? '',
        peerUserNo: peer.userNo,
        nickname: peer.nickname,
        profileUrl: peer.profileUrl,
        lastMessage: '',
        timeLabel: '',
        unread: 0,
      };
      if (!room.id) throw new Error('대화방을 만들지 못했습니다.');
      setRooms((prev) => [room, ...prev.filter((item) => item.id !== room.id)]);
      setPicking(false);
      await openRoom(room);
    } catch (err) {
      setPeerStatus(pickErrorMessage(err, '대화를 시작하지 못했습니다.'));
    }
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    if (!active || sending) return;
    const body = draft.trim();
    if (!body && !pendingShare) return;
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
      const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.messages, payload);
      const created = mapMessage(res.data);
      if (created) setMessages((prev) => [...prev, created]);
      setRooms((prev) =>
        prev.map((room) =>
          room.id === active.id
            ? {
                ...room,
                lastMessage:
                  body ||
                  (pendingShare?.kind === 'story' ? '스토리를 공유했습니다' : '') ||
                  (pendingShare?.kind === 'feed' ? '게시글을 공유했습니다' : room.lastMessage),
                timeLabel: '방금',
              }
            : room,
        ),
      );
      setDraft('');
      if (pendingShare) {
        setPendingShare(null);
        router.replace('/dm');
      }
    } catch (err) {
      setThreadStatus(pickErrorMessage(err, '메시지를 보내지 못했습니다.'));
    } finally {
      setSending(false);
    }
  }

  if (active) {
    const canSend = draft.trim().length > 0 || pendingShare != null;
    return (
      <div className={styles.shell}>
        <PageHeader
          title={active.nickname}
          onBack={() => setActiveId(null)}
          right={
            <Link href={myUltaryPath(active.nickname)} className={styles.profileLink}>
              울타리
            </Link>
          }
        />
        <div className={styles.thread}>
          <div className={styles.messages}>
            {olderCursor ? (
              <button type="button" className={styles.older} onClick={() => void loadOlder()}>
                이전 메시지
              </button>
            ) : null}
            {threadStatus ? <p className={styles.status}>{threadStatus}</p> : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={clsx(styles.bubbleRow, message.fromMe && styles.bubbleRowMe)}
              >
                <div className={clsx(styles.bubble, message.fromMe && styles.bubbleMe)}>
                  {message.share ? <ShareCard share={message.share} /> : null}
                  {message.body ? <p className={styles.bubbleText}>{message.body}</p> : null}
                  <span className={styles.bubbleTime}>{message.timeLabel}</span>
                </div>
              </div>
            ))}
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
              <Image src={SendIcon} alt="" width={22} height={22} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (picking) {
    return (
      <div className={styles.shell}>
        <PageHeader title="대화 상대" onBack={() => setPicking(false)} />
        <main className={styles.main}>
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={peerTab === 'RESIDENTS'}
              className={clsx(styles.tab, peerTab === 'RESIDENTS' && styles.tabOn)}
              onClick={() => setPeerTab('RESIDENTS')}
            >
              주민
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={peerTab === 'NEIGHBORS'}
              className={clsx(styles.tab, peerTab === 'NEIGHBORS' && styles.tabOn)}
              onClick={() => setPeerTab('NEIGHBORS')}
            >
              이웃
            </button>
          </div>
          {peerStatus ? <p className={styles.status}>{peerStatus}</p> : null}
          {peers.length === 0 && !peerStatus ? (
            <EmptyState title="목록이 비어 있어요" description="주민이나 이웃이 있으면 여기서 고를 수 있어요." />
          ) : (
            <ul className={styles.roomList}>
              {peers.map((peer) => (
                <li key={peer.userNo}>
                  <button type="button" className={styles.roomItem} onClick={() => void openPeer(peer)}>
                    <span className={styles.roomAvatar}>
                      <MediaImage
                        src={peer.profileUrl}
                        alt=""
                        width={48}
                        height={48}
                        className={styles.roomAvatarImg}
                      />
                    </span>
                    <span className={styles.roomNick}>{peer.nickname}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader
        title="메시지"
        right={
          <button type="button" className={styles.textBtn} onClick={() => setPicking(true)}>
            새 메시지
          </button>
        }
      />
      <main className={styles.main}>
        {pendingShare ? (
          <p className={styles.status}>
            {pendingShare.kind === 'story' ? '스토리를 보낼 대화를 고르세요.' : '게시글을 보낼 대화를 고르세요.'}
          </p>
        ) : null}
        {status ? <p className={styles.status}>{status}</p> : null}
        {!status && rooms.length === 0 ? (
          <EmptyState
            title="아직 메시지가 없어요"
            description="주민이나 이웃을 골라 대화를 시작할 수 있어요."
          />
        ) : (
          <ul className={styles.roomList}>
            {rooms.map((room) => (
              <li key={room.id}>
                <button type="button" className={styles.roomItem} onClick={() => void openRoom(room)}>
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
                      <span className={styles.roomTime}>{room.timeLabel}</span>
                    </span>
                    <span className={styles.roomBottom}>
                      <span className={styles.roomPreview}>{room.lastMessage}</span>
                      {room.unread > 0 ? <span className={styles.badge}>{room.unread}</span> : null}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <FooterMenu />
    </div>
  );
}
