'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPatchJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { MY_NICKNAME, OTHER_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import type { BffEnvelope } from '@/types/api';
import type { NotificationType } from '@/types/enums';
import type { Notification } from '@/types/notification';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './notifications.module.scss';

const OTHER_PROFILE = '/images/mock/feed.jpg';
const OTHER_PROFILE_2 = '/images/mock/post_ex.jpg';

type NeighborAction = 'accept' | 'cancel';

type NotificationKind =
  | 'neighbor'
  | 'likePost'
  | 'likeComment'
  | 'likeReply'
  | 'commentOnPost'
  | 'replyOnComment'
  | 'mentionComment'
  | 'mentionReply'
  | 'tagPost'
  | 'tagStory'
  | 'storyReact';

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  /** 대표(첫) 행위자 */
  actorNickname: string;
  profileUrl: string;
  timeLabel: string;
  /** 추가 인원 수 — 있으면 "님 외 N명이" */
  othersCount?: number;
  preview?: string;
  /** 대상 게시글 소유자 (기본: 나) */
  feedOwnerNickname?: string;
  feedId?: string;
  commentId?: string;
  replyId?: string;
  storyId?: string;
  neighborAction?: NeighborAction;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    kind: 'neighbor',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    timeLabel: '8월29일 15:59',
    neighborAction: 'accept',
  },
  {
    id: 'n2',
    kind: 'likePost',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    othersCount: 4,
    preview: '오늘도 산책 나왔어요~',
    timeLabel: '8월29일 15:40',
    feedOwnerNickname: MY_NICKNAME,
    feedId: '1',
  },
  {
    id: 'n3',
    kind: 'likeComment',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    othersCount: 2,
    preview: `@${MY_NICKNAME} 귀여워요\nㅎㅎ`,
    timeLabel: '8월29일 15:20',
    feedOwnerNickname: MY_NICKNAME,
    feedId: '2',
    commentId: 'c-12',
  },
  {
    id: 'n4',
    kind: 'likeReply',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: `@${OTHER_NICKNAME} 맞아요\n완전!`,
    timeLabel: '8월29일 15:10',
    feedOwnerNickname: MY_NICKNAME,
    feedId: '2',
    commentId: 'c-12',
    replyId: 'r-3',
  },
  {
    id: 'n5',
    kind: 'commentOnPost',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: `@${MY_NICKNAME} 아\n메\n리\n카\n노 맛있겠다!`,
    timeLabel: '8월29일 14:55',
    feedOwnerNickname: MY_NICKNAME,
    feedId: '1',
    commentId: 'c-20',
  },
  {
    id: 'n6',
    kind: 'replyOnComment',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: `@${MY_NICKNAME} 저도\n동의해요!`,
    timeLabel: '8월29일 14:40',
    feedOwnerNickname: MY_NICKNAME,
    feedId: '1',
    commentId: 'c-20',
    replyId: 'r-8',
  },
  {
    id: 'n7',
    kind: 'mentionComment',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: `@${MY_NICKNAME} 이거\n같이 가요`,
    timeLabel: '8월28일 21:10',
    feedOwnerNickname: OTHER_NICKNAME,
    feedId: '5',
    commentId: 'c-33',
  },
  {
    id: 'n8',
    kind: 'mentionReply',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE_2,
    preview: `@${MY_NICKNAME} 오\n좋다!`,
    timeLabel: '8월28일 20:50',
    feedOwnerNickname: OTHER_NICKNAME,
    feedId: '5',
    commentId: 'c-33',
    replyId: 'r-9',
  },
  {
    id: 'n9',
    kind: 'tagPost',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: '우리집\n강아지랑',
    timeLabel: '8월28일 18:40',
    feedOwnerNickname: OTHER_NICKNAME,
    feedId: '7',
  },
  {
    id: 'n10',
    kind: 'tagStory',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: '해질녘\n공원',
    timeLabel: '8월28일 18:10',
    storyId: 'story-2',
  },
  {
    id: 'n11',
    kind: 'storyReact',
    actorNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    othersCount: 4,
    preview: '산책\n인증',
    timeLabel: '8월27일 19:05',
    storyId: 'story-1',
  },
];

/** 줄바꿈 제거 후 최대 length자 + … (앞쪽 @멘션은 길이에 미포함) */
function toPreviewSnippet(text: string, max = 6, preserveLeadingMentions = false) {
  const flat = text.replace(/[\r\n]/g, '');
  if (!preserveLeadingMentions) {
    if (flat.length <= max) return flat;
    return `${flat.slice(0, max)}...`;
  }

  const mentionMatch = flat.match(/^((?:@\S+\s*)+)/);
  const mention = mentionMatch?.[1] ?? '';
  const rest = flat.slice(mention.length);
  if (rest.length <= max) return `${mention}${rest}`;
  return `${mention}${rest.slice(0, max)}...`;
}

function shouldPreserveMentions(kind: NotificationKind) {
  return (
    kind === 'likeComment' ||
    kind === 'likeReply' ||
    kind === 'commentOnPost' ||
    kind === 'replyOnComment' ||
    kind === 'mentionComment' ||
    kind === 'mentionReply'
  );
}

function KeywordButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.keyword} onClick={onClick}>
      {label}
    </button>
  );
}

function goPost(item: NotificationItem, router: ReturnType<typeof useRouter>) {
  if (!item.feedId) return;
  const owner = item.feedOwnerNickname ?? MY_NICKNAME;
  router.push(`${myUltaryPath(owner)}/posts/${item.feedId}`);
}

function goStory(item: NotificationItem, router: ReturnType<typeof useRouter>) {
  console.log('[notifications] 해당스토리로이동', item.storyId);
  router.push('/stories');
}

function logCommentNav(item: NotificationItem) {
  console.log('[notifications] 해당댓글로이동', {
    feedId: item.feedId,
    commentId: item.commentId,
  });
}

function logReplyNav(item: NotificationItem) {
  console.log('[notifications] 해당답글로이동', {
    feedId: item.feedId,
    commentId: item.commentId,
    replyId: item.replyId,
  });
}

function ActorPhrase({
  nickname,
  othersCount,
}: {
  nickname: string;
  othersCount?: number;
}) {
  const nick = (
    <Link href={myUltaryPath(nickname)} className={styles.nickname}>
      {nickname}
    </Link>
  );
  if (othersCount != null && othersCount > 0) {
    return (
      <>
        {nick}님 외 {othersCount}명이
      </>
    );
  }
  return <>{nick}님이</>;
}

function NotificationMessage({ item }: { item: NotificationItem }) {
  const router = useRouter();
  const snippet = item.preview
    ? toPreviewSnippet(item.preview, 6, shouldPreserveMentions(item.kind))
    : null;
  const previewNode =
    snippet != null ? <span className={styles.preview}>&quot;{snippet}&quot;</span> : null;
  const time = <span className={styles.time}>{item.timeLabel}</span>;
  const actor = (
    <ActorPhrase nickname={item.actorNickname} othersCount={item.othersCount} />
  );
  const nickOnly = (
    <Link href={myUltaryPath(item.actorNickname)} className={styles.nickname}>
      {item.actorNickname}
    </Link>
  );

  let action: ReactNode;
  switch (item.kind) {
    case 'neighbor':
      action = <>{nickOnly}님이 나와의 이웃을 신청했습니다.</>;
      break;
    case 'likePost':
      action = (
        <>
          {actor} <KeywordButton label="게시글" onClick={() => goPost(item, router)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'likeComment':
      action = (
        <>
          {actor} <KeywordButton label="댓글" onClick={() => logCommentNav(item)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'likeReply':
      action = (
        <>
          {actor} <KeywordButton label="답글" onClick={() => logReplyNav(item)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'commentOnPost':
      action = (
        <>
          {actor} 게시글에 <KeywordButton label="댓글" onClick={() => logCommentNav(item)} />을
          남겼습니다.
        </>
      );
      break;
    case 'replyOnComment':
      action = (
        <>
          {actor} 댓글에 <KeywordButton label="답글" onClick={() => logReplyNav(item)} />을
          남겼습니다.
        </>
      );
      break;
    case 'mentionComment':
      action = (
        <>
          {actor} <KeywordButton label="댓글" onClick={() => logCommentNav(item)} />에서
          회원님을 언급했습니다.
        </>
      );
      break;
    case 'mentionReply':
      action = (
        <>
          {actor} <KeywordButton label="답글" onClick={() => logReplyNav(item)} />에서
          회원님을 언급했습니다.
        </>
      );
      break;
    case 'tagPost':
      action = (
        <>
          {actor} <KeywordButton label="게시글" onClick={() => goPost(item, router)} />에서
          회원님을 태그했습니다.
        </>
      );
      break;
    case 'tagStory':
      action = (
        <>
          {actor} <KeywordButton label="스토리" onClick={() => goStory(item, router)} />에서
          회원님을 태그했습니다.
        </>
      );
      break;
    case 'storyReact':
      action = (
        <>
          {actor} <KeywordButton label="스토리" onClick={() => goStory(item, router)} />에
          공감을 표시했습니다.
        </>
      );
      break;
  }

  return (
    <p className={styles.message}>
      {action}
      {previewNode ? <> {previewNode}</> : null} {time}
    </p>
  );
}

function formatNotifTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}월${d.getDate()}일 ${hh}:${mm}`;
}

function mapNotificationType(type: NotificationType): NotificationKind | null {
  switch (type) {
    case 'FEED_LIKE':
      return 'likePost';
    case 'FEED_COMMENT':
      return 'commentOnPost';
    case 'FEED_REPLY':
      return 'replyOnComment';
    case 'MENTION':
      return 'mentionComment';
    case 'NEIGHBOR_REQUEST':
      return 'neighbor';
    case 'PET_TAG_REQUEST':
    case 'PET_TAG_APPROVED':
      return 'tagPost';
    case 'NEIGHBOR_ACCEPTED':
    case 'SYSTEM':
    default:
      return null;
  }
}

function pickActorNickname(n: Notification) {
  const content = n.content?.trim() ?? '';
  const match = content.match(/^@?([A-Za-z0-9_]{2,32})/);
  if (match) return match[1];
  if (n.actorUserNo != null) return `USER_${n.actorUserNo}`;
  return '이웃';
}

function mapApiNotification(n: Notification): NotificationItem | null {
  const kind = mapNotificationType(n.type);
  if (!kind) return null;
  return {
    id: String(n.notificationId),
    kind,
    actorNickname: pickActorNickname(n),
    profileUrl: OTHER_PROFILE,
    timeLabel: formatNotifTime(n.createdAt),
    preview: n.content ?? undefined,
    feedOwnerNickname: MY_NICKNAME,
    feedId: n.feedId != null ? String(n.feedId) : undefined,
    commentId: n.feedCommentId != null ? String(n.feedCommentId) : undefined,
    replyId: n.feedReplyId != null ? String(n.feedReplyId) : undefined,
    neighborAction: kind === 'neighbor' ? 'accept' : undefined,
  };
}

function unwrapNotificationList(data: unknown): Notification[] {
  if (Array.isArray(data)) return data as Notification[];
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: Notification[] }).items;
  }
  return [];
}

/** 알림 페이지 */
export default function NotificationsClient() {
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.notifications.root, {
          size: 30,
        });
        const list = unwrapNotificationList(res.data);
        const mapped = list
          .map(mapApiNotification)
          .filter((v): v is NotificationItem => v != null);
        if (cancelled) return;
        if (mapped.length > 0) {
          setItems(mapped);
          setStatus(null);
          for (const n of list) {
            if (!n.isRead) {
              bffPatchJson(bffEndpoints.notifications.read, {
                notificationId: n.notificationId,
              }).catch((err) => console.warn('[notifications] read', err));
            }
          }
        } else {
          setStatus('새 알림이 없어 예시 목록을 표시합니다.');
        }
      } catch (err) {
        console.warn('[notifications] BFF fallback', err);
        if (!cancelled) setStatus('알림을 불러오지 못해 예시 목록을 표시합니다.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleNeighbor(id: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.kind !== 'neighbor') return item;
        const next: NeighborAction =
          item.neighborAction === 'accept' ? 'cancel' : 'accept';
        console.log('[notifications] 이웃신청', { id, action: next });
        return { ...item, neighborAction: next };
      }),
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="알림" />

      <main className={styles.main}>
        {status ? <p className={styles.status}>{status}</p> : null}
        <ul className={styles.list}>
          {items.map((item) => {
            const ultaryHref = myUltaryPath(item.actorNickname);
            const isNeighbor = item.kind === 'neighbor';
            const neighborAccept = item.neighborAction === 'accept';

            return (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemBody}>
                  <Link
                    href={ultaryHref}
                    className={styles.imageWrap}
                    aria-label={`${item.actorNickname} 울타리`}
                  >
                    <Image
                      src={item.profileUrl}
                      alt=""
                      width={39}
                      height={39}
                      className={styles.image}
                    />
                  </Link>
                  <div className={styles.info}>
                    <NotificationMessage item={item} />
                  </div>
                  {isNeighbor ? (
                    <div className={styles.actionWrap}>
                      <button
                        type="button"
                        className={clsx(
                          styles.actionBtn,
                          neighborAccept ? styles.actionAccept : styles.actionCancel,
                        )}
                        onClick={() => toggleNeighbor(item.id)}
                      >
                        {neighborAccept ? '수락' : '취소'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      <FooterMenu />
    </div>
  );
}
