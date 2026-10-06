'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPatchJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { isRecord } from '@/lib/api/error';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { openFeedComment, postPagePath } from '@/lib/notification/openTarget';
import { fetchUnreadCount, publishUnreadBadge } from '@/lib/notification/unreadBadge';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope } from '@/types/api';
import type { FileSummary } from '@/types/file';
import clsx from 'clsx';
import { MediaImage } from '@/components/common/MediaImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './notifications.module.scss';

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
  /** 서버가 준 문장. 있으면 이 문장의 댓글·답글·게시글을 누른다 */
  message?: string;
  /** 대상 게시글 소유자 (기본: 나) */
  feedOwnerNickname?: string;
  feedId?: string;
  commentId?: string;
  replyId?: string;
  storyId?: string;
  /** 스토리를 올린 사람. 태그 알림은 행위자, 공감 알림은 나 */
  actorUserNo?: string;
  neighborAction?: NeighborAction;
};

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
  router.push(postPagePath(item.feedId));
}

function goStory(item: NotificationItem, router: ReturnType<typeof useRouter>) {
  if (!item.storyId) return;
  const q = new URLSearchParams();
  if (item.kind === 'tagStory' && item.actorUserNo) {
    q.set('userNo', item.actorUserNo);
    if (item.actorNickname.trim()) q.set('nickname', item.actorNickname.trim());
  }
  const qs = q.toString();
  router.push(`/stories/${item.storyId}${qs ? `?${qs}` : ''}`);
}

function goComment(item: NotificationItem, router: ReturnType<typeof useRouter>) {
  void openFeedComment(
    router,
    {
      feedId: item.feedId,
      commentId: item.commentId,
      replyId: item.replyId,
      feedOwnerNickname: item.feedOwnerNickname,
    },
    'comment',
  );
}

function goReply(item: NotificationItem, router: ReturnType<typeof useRouter>) {
  void openFeedComment(
    router,
    {
      feedId: item.feedId,
      commentId: item.commentId,
      replyId: item.replyId,
      feedOwnerNickname: item.feedOwnerNickname,
    },
    'reply',
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function linkifyMessage(
  message: string,
  item: NotificationItem,
  router: ReturnType<typeof useRouter>,
) {
  const nickname = item.actorNickname.trim();
  const token = nickname
    ? `(${escapeRegExp(nickname)}|댓글|답글|게시글|스토리)`
    : '(댓글|답글|게시글|스토리)';
  const parts = message.split(new RegExp(token, 'g'));
  return parts.map((part, index) => {
    if (nickname && part === nickname) {
      return (
        <Link key={index} href={myUltaryPath(nickname)} className={styles.nickname}>
          {part}
        </Link>
      );
    }
    if (part === '댓글') {
      return <KeywordButton key={index} label={part} onClick={() => goComment(item, router)} />;
    }
    if (part === '답글') {
      return <KeywordButton key={index} label={part} onClick={() => goReply(item, router)} />;
    }
    if (part === '게시글') {
      return <KeywordButton key={index} label={part} onClick={() => goPost(item, router)} />;
    }
    if (part === '스토리') {
      return <KeywordButton key={index} label={part} onClick={() => goStory(item, router)} />;
    }
    return <span key={index}>{part}</span>;
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
    ? item.message
      ? item.preview
      : toPreviewSnippet(item.preview, 6, shouldPreserveMentions(item.kind))
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
          {actor} <KeywordButton label="댓글" onClick={() => goComment(item, router)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'likeReply':
      action = (
        <>
          {actor} <KeywordButton label="답글" onClick={() => goReply(item, router)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'commentOnPost':
      action = (
        <>
          {actor} 게시글에 <KeywordButton label="댓글" onClick={() => goComment(item, router)} />을
          남겼습니다.
        </>
      );
      break;
    case 'replyOnComment':
      action = (
        <>
          {actor} 댓글에 <KeywordButton label="답글" onClick={() => goReply(item, router)} />을
          남겼습니다.
        </>
      );
      break;
    case 'mentionComment':
      action = (
        <>
          {actor} <KeywordButton label="댓글" onClick={() => goComment(item, router)} />에서
          회원님을 언급했습니다.
        </>
      );
      break;
    case 'mentionReply':
      action = (
        <>
          {actor} <KeywordButton label="답글" onClick={() => goReply(item, router)} />에서
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
      {item.message ? linkifyMessage(item.message, item, router) : action}
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

function mapNotificationType(
  type: string,
  replyId: number | null,
): NotificationKind | null {
  switch (type) {
    case 'FEED_LIKE':
      return 'likePost';
    case 'COMMENT_LIKE':
      return 'likeComment';
    case 'REPLY_LIKE':
      return 'likeReply';
    case 'FEED_REPLY':
      return 'replyOnComment';
    case 'FEED_COMMENT':
      return replyId != null ? 'replyOnComment' : 'commentOnPost';
    case 'COMMENT_MENTION':
    case 'MENTION':
      return 'mentionComment';
    case 'REPLY_MENTION':
      return 'mentionReply';
    case 'FEED_TAG':
    case 'PET_TAG_REQUEST':
    case 'PET_TAG_APPROVED':
      return 'tagPost';
    case 'STORY_TAG':
      return 'tagStory';
    case 'STORY_LIKE':
      return 'storyReact';
    case 'NEIGHBOR_REQUEST':
      return 'neighbor';
    case 'NEIGHBOR_ACCEPTED':
    case 'SYSTEM':
    default:
      return null;
  }
}

function asFile(value: unknown): Pick<FileSummary, 'fileId' | 'filePath'> | null {
  if (!isRecord(value)) return null;
  if (typeof value.filePath !== 'string' || !value.filePath.trim()) return null;
  return {
    fileId: typeof value.fileId === 'number' ? value.fileId : 0,
    filePath: value.filePath,
  };
}

function idString(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function mapApiNotification(raw: unknown): NotificationItem | null {
  if (!isRecord(raw) || typeof raw.type !== 'string') return null;
  const replyId = idString(raw.feedReplyId);
  const kind = mapNotificationType(raw.type, replyId != null ? Number(replyId) : null);
  if (!kind) return null;
  const actorCount = typeof raw.actorCount === 'number' ? raw.actorCount : 1;
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';
  const snippet =
    (typeof raw.snippet === 'string' && raw.snippet.trim()) ||
    (typeof raw.content === 'string' && raw.content.trim()) ||
    '';
  const when =
    (typeof raw.updatedAt === 'string' && raw.updatedAt) ||
    (typeof raw.createdAt === 'string' && raw.createdAt) ||
    '';
  const actorNickname =
    (typeof raw.actorNickname === 'string' && raw.actorNickname.trim()) ||
    (typeof raw.actorUserNo === 'number' ? `USER_${raw.actorUserNo}` : '이웃');
  const neighborStatus = typeof raw.neighborStatus === 'string' ? raw.neighborStatus : '';
  return {
    id: idString(raw.notificationId) ?? `${raw.type}-${when}`,
    kind,
    actorNickname,
    profileUrl: resolveFileDisplayUrl(asFile(raw.actorProfileFile)) ?? NO_PROFILE_SRC,
    timeLabel: when ? formatNotifTime(when) : '',
    othersCount: actorCount > 1 ? actorCount - 1 : undefined,
    preview: snippet || undefined,
    message: message || undefined,
    feedId: idString(raw.feedId),
    commentId: idString(raw.feedCommentId),
    replyId,
    storyId: idString(raw.storyId),
    actorUserNo: idString(raw.actorUserNo),
    neighborAction:
      kind === 'neighbor' && (neighborStatus === '' || neighborStatus === 'PENDING')
        ? 'accept'
        : undefined,
  };
}

function unwrapNotificationList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  return [];
}

function isUnread(raw: unknown): boolean {
  if (!isRecord(raw)) return false;
  if (typeof raw.read === 'boolean') return !raw.read;
  if (typeof raw.isRead === 'boolean') return !raw.isRead;
  if (typeof raw.isRead === 'number') return raw.isRead === 0;
  return false;
}

/** 알림 페이지 */
export default function NotificationsClient() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.notifications.root, {
          limit: 30,
        });
        const list = unwrapNotificationList(res.data);
        const mapped = list
          .map(mapApiNotification)
          .filter((v): v is NotificationItem => v != null);
        if (cancelled) return;
        void fetchUnreadCount()
          .then((count) => {
            if (!cancelled) publishUnreadBadge(count);
          })
          .catch((err) => console.warn('[notifications] unread count', err));
        setItems(mapped);
        setStatus(null);
        for (const n of list) {
          if (!isUnread(n) || !isRecord(n)) continue;
          const notificationId = idString(n.notificationId);
          if (!notificationId) continue;
          bffPatchJson(bffEndpoints.notifications.read, { notificationId }).catch((err) =>
            console.warn('[notifications] read', err),
          );
        }
      } catch (err) {
        console.warn('[notifications] BFF load failed', err);
        if (!cancelled) {
          setItems([]);
          setStatus('알림을 불러오지 못했습니다.');
        }
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
                    <MediaImage
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
