'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import { bffDelete, bffGet, bffPatchJson, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { isHttpError, isRecord } from '@/lib/api/error';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { openFeedComment, postPagePath } from '@/lib/notification/openTarget';
import { moderationNoticeParts } from '@/lib/notification/moderationNotice';
import { fetchUnreadCount, publishUnreadBadge, subscribeUnreadBadge } from '@/lib/notification/unreadBadge';
import { showFooterNotice } from '@/lib/ui/footerNotice';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope } from '@/types/api';
import type { FileSummary } from '@/types/file';
import clsx from 'clsx';
import { MediaImage } from '@/components/common/MediaImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './notifications.module.scss';

type NotificationKind =
  | 'tagApproved'
  | 'tagRejected'
  | 'moderation'
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
  neighborId?: number;
  neighborStatus?: string;
  /** 알림을 받은 내가 행위자를 팔로우 중 */
  following?: boolean;
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
  const snippet = item.kind !== 'moderation' && item.preview
    ? item.message
      ? item.preview
      : toPreviewSnippet(item.preview, 6, shouldPreserveMentions(item.kind))
    : null;
  const previewNode =
    snippet != null ? <span className={styles.preview}>&quot;{snippet}&quot;</span> : null;
  const time = <span className={styles.time}>{item.timeLabel}</span>;
  if (item.kind === 'tagApproved' || item.kind === 'tagRejected') {
    const rejected = item.kind === 'tagRejected';
    return <p className={styles.message}><Link href="/settings/hashtags" className={styles.keyword}>#{item.preview}</Link> 의 태그 요청이 {rejected ? <span className={styles.tagRejected}>거절</span> : '수락'}되었습니다. {time}</p>;
  }
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
    case 'moderation':
      action = moderationNoticeParts(item.message ?? '콘텐츠 확인 결과가 있습니다.', item).map((part, index) =>
        part.href ? <Link key={index} href={part.href} className={styles.keyword}>{part.text}</Link> : part.text,
      );
      break;
    case 'neighbor':
      action =
        item.neighborStatus === 'ACCEPTED' ? (
          <>{nickOnly}님이 팔로우했습니다.</>
        ) : (
          <>{nickOnly}님이 팔로우를 요청했습니다.</>
        );
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
      {item.message && item.kind !== 'moderation' ? linkifyMessage(item.message, item, router) : action}
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
    case 'AI_MODERATION':
      return 'moderation';
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
      return null;
    case 'TAG_PROFILE_APPROVED':
      return 'tagApproved';
    case 'TAG_PROFILE_REJECTED':
      return 'tagRejected';
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
    (typeof raw.actorUserNo === 'number' ? `USER_${raw.actorUserNo}` : '사용자');
  const neighborStatus = typeof raw.neighborStatus === 'string' ? raw.neighborStatus : '';
  const neighborId =
    typeof raw.neighborId === 'number'
      ? raw.neighborId
      : typeof raw.neighborId === 'string' && /^\d+$/.test(raw.neighborId)
        ? Number(raw.neighborId)
        : undefined;
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
    neighborId,
    neighborStatus: neighborStatus || undefined,
    following: raw.following === true,
  };
}

function neighborControl(item: NotificationItem): 'follow' | 'cancel' | null {
  if (item.kind !== 'neighbor' || item.neighborId == null) return null;
  if (item.neighborStatus === 'REJECTED') return null;
  if (item.following) return 'cancel';
  if (item.neighborStatus === 'PENDING' || item.neighborStatus === 'ACCEPTED') return 'follow';
  return null;
}

function readNeighborId(raw: unknown) {
  if (!isRecord(raw) || typeof raw.neighborId !== 'number') return null;
  return raw.neighborId;
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

/** 알림 목록. 알림 페이지와 PC 팝업이 같이 쓴다 */
export function NotificationInbox({ variant = 'page' }: { variant?: 'page' | 'popup' }) {
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    let seen = false;
    let baseline = 0;

    async function load() {
      const gen = ++generation;
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.notifications.root, {
          limit: 30,
        });
        const list = unwrapNotificationList(res.data);
        const mapped = list
          .map(mapApiNotification)
          .filter((v): v is NotificationItem => v != null);
        if (cancelled || gen !== generation) return;
        seen = true;
        setItems(mapped);
        setStatus(null);
        await Promise.all(
          list.map(async (n) => {
            if (!isUnread(n) || !isRecord(n)) return;
            const notificationId = idString(n.notificationId);
            if (!notificationId) return;
            await bffPatchJson(bffEndpoints.notifications.read, { notificationId }).catch((err) =>
              console.warn('[notifications] read', err),
            );
          }),
        );
        if (cancelled || gen !== generation) return;
        const count = await fetchUnreadCount().catch((err) => {
          console.warn('[notifications] unread count', err);
          return null;
        });
        if (cancelled || gen !== generation || count == null) return;
        baseline = count;
        publishUnreadBadge(count);
      } catch (err) {
        console.warn('[notifications] BFF load failed', err);
        if (!cancelled && gen === generation && !seen) {
          setItems([]);
          setStatus('알림을 불러오지 못했습니다.');
        setLoadFailed({ error: err });
        }
      }
    }

    void load();
    const unsubscribe = subscribeUnreadBadge((count) => {
      if (count > baseline) {
        baseline = count;
        void load();
        return;
      }
      baseline = count;
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function followNeighbor(item: NotificationItem) {
    if (item.neighborId == null || actingId) return;
    setActingId(item.id);
    try {
      if (item.neighborStatus === 'PENDING') {
        await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.users.neighborAccept, {
          neighborId: item.neighborId,
        });
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? { ...row, following: true, neighborStatus: 'ACCEPTED' }
              : row,
          ),
        );
      } else if (item.neighborStatus === 'ACCEPTED') {
        const userNo = Number(item.actorUserNo);
        if (!Number.isFinite(userNo)) throw new Error('user missing');
        const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.users.neighborRequest, {
          userNo,
        });
        const neighborId = readNeighborId(res.data) ?? item.neighborId;
        const accepted = isRecord(res.data) && res.data.status === 'ACCEPTED';
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? { ...row, neighborId, following: accepted ? true : row.following }
              : row,
          ),
        );
        if (!accepted) {
          showFooterNotice('팔로우 요청을 보냈습니다.');
          return;
        }
      } else {
        return;
      }
      showFooterNotice('팔로우했습니다.');
    } catch (err) {
      console.warn('[notifications] follow', err);
      showFooterNotice(pickErrorMessage(err, '팔로우하지 못했습니다.'));
    } finally {
      setActingId(null);
    }
  }

  async function cancelNeighbor(item: NotificationItem) {
    if (item.neighborId == null || actingId) return;
    setActingId(item.id);
    try {
      await bffDelete<BffEnvelope<unknown>>(bffEndpoints.users.neighborCancel, {
        neighborId: item.neighborId,
      });
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, following: false } : row)),
      );
      showFooterNotice('팔로우를 취소했습니다.');
    } catch (err) {
      console.warn('[notifications] cancel', err);
      showFooterNotice(pickErrorMessage(err, '팔로우를 취소하지 못했습니다.'));
    } finally {
      setActingId(null);
    }
  }

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

  return (
    <>
        {status ? <p className={styles.status}>{status}</p> : null}
        <ul className={clsx(styles.list, variant === 'popup' && styles.listPc)}>
          {items.map((item) => {
            const ultaryHref = myUltaryPath(item.actorNickname);
            const neighborAction = neighborControl(item);

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
                  {neighborAction ? (
                    <div className={styles.actionWrap}>
                      <button
                        type="button"
                        className={clsx(
                          styles.actionBtn,
                          neighborAction === 'follow' ? styles.actionAccept : styles.actionCancel,
                        )}
                        disabled={actingId === item.id}
                        onClick={() =>
                          void (neighborAction === 'follow'
                            ? followNeighbor(item)
                            : cancelNeighbor(item))
                        }
                      >
                        {neighborAction === 'follow' ? '팔로우' : '취소'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
    </>
  );
}
