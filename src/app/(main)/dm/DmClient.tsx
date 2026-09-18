'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { MOCK_DM_ROOMS, type MockDmMessage, type MockDmRoom } from '@/lib/mock/dm';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import styles from './dm.module.scss';

const SendIcon = '/images/icon/Send.svg';

/** 메시지(DM) — 방 목록 + 스레드 */
export default function DmClient() {
  const [rooms, setRooms] = useState(MOCK_DM_ROOMS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const threadEndRef = useRef<HTMLDivElement>(null);

  const active = rooms.find((r) => r.id === activeId) ?? null;

  useEffect(() => {
    if (!active) return;
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active, active?.messages.length]);

  function openRoom(room: MockDmRoom) {
    setActiveId(room.id);
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unread: 0 } : r)),
    );
    setDraft('');
  }

  function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    if (!active || !draft.trim()) return;
    const msg: MockDmMessage = {
      id: `local-${Date.now()}`,
      fromMe: true,
      text: draft.trim(),
      timeLabel: '방금',
    };
    setRooms((prev) =>
      prev.map((r) =>
        r.id === active.id
          ? {
              ...r,
              lastMessage: msg.text,
              timeLabel: '방금',
              messages: [...r.messages, msg],
            }
          : r,
      ),
    );
    setDraft('');
  }

  if (active) {
    return (
      <div className={styles.shell}>
        <PageHeader
          title={active.nickname}
          onBack={() => setActiveId(null)}
          right={
            <Link
              href={myUltaryPath(active.nickname)}
              className={styles.profileLink}
            >
              울타리
            </Link>
          }
        />
        <div className={styles.thread}>
          <div className={styles.messages}>
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={clsx(styles.bubbleRow, m.fromMe && styles.bubbleRowMe)}
              >
                <div
                  className={clsx(styles.bubble, m.fromMe && styles.bubbleMe)}
                >
                  <p className={styles.bubbleText}>{m.text}</p>
                  <span className={styles.bubbleTime}>{m.timeLabel}</span>
                </div>
              </div>
            ))}
            <div ref={threadEndRef} />
          </div>
          <form className={styles.composer} onSubmit={sendMessage}>
            <input
              className={styles.composerInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="메시지를 입력하세요…"
              aria-label="메시지 입력"
            />
            <button
              type="submit"
              className={styles.composerSend}
              disabled={!draft.trim()}
              aria-label="전송"
            >
              <Image src={SendIcon} alt="" width={22} height={22} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="메시지" />
      <main className={styles.main}>
        {rooms.length === 0 ? (
          <EmptyState
            title="아직 메시지가 없어요"
            description="이웃과 대화를 시작하면 여기에 표시돼요."
          />
        ) : (
          <ul className={styles.roomList}>
            {rooms.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  className={styles.roomItem}
                  onClick={() => openRoom(room)}
                >
                  <span className={styles.roomAvatar}>
                    <Image
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
                      {room.unread > 0 ? (
                        <span className={styles.badge}>{room.unread}</span>
                      ) : null}
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
