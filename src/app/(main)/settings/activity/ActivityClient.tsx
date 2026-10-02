'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { MediaImage } from '@/components/common/MediaImage';
import { PageHeader } from '@/components/common/PageHeader';
import { bffDelete, bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { openFeedComment, postPagePath } from '@/lib/notification/openTarget';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import type { BffEnvelope } from '@/types/api';
import type { FileSummary } from '@/types/file';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import styles from './activity.module.scss';

type ActivityKind =
  | 'like'
  | 'likeComment'
  | 'likeReply'
  | 'comment'
  | 'reply'
  | 'neighbor'
  | 'post'
  | 'story';

type ActivityItem = {
  id: string;
  kind: ActivityKind;
  targetNickname: string;
  profileUrl: string;
  timeLabel: string;
  preview?: string;
  feedId?: string;
  commentId?: string;
  replyId?: string;
  storyId?: string;
  neighborId?: string;
  /** PENDING일 때만 취소 버튼 */
  neighborPending?: boolean;
  monthKey: string;
  monthLabel: string;
};

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

function formatActivityTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}월${d.getDate()}일 ${hh}:${mm}`;
}

function monthOf(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { key: 'unknown', label: '' };
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const label =
    year === new Date().getFullYear() ? `${month}월` : `${year}년 ${month}월`;
  return { key: `${year}-${month}`, label };
}

function groupByMonth(items: ActivityItem[]) {
  const groups: { key: string; label: string; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.key === item.monthKey) last.items.push(item);
    else groups.push({ key: item.monthKey, label: item.monthLabel, items: [item] });
  }
  return groups;
}

function idString(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function asFile(value: unknown): Pick<FileSummary, 'fileId' | 'filePath'> | null {
  if (!isRecord(value)) return null;
  if (typeof value.filePath !== 'string' || !value.filePath.trim()) return null;
  return {
    fileId: typeof value.fileId === 'number' ? value.fileId : 0,
    filePath: value.filePath,
  };
}

function mapActivityType(type: string): ActivityKind | null {
  switch (type) {
    case 'FEED_LIKE':
      return 'like';
    case 'COMMENT_LIKE':
      return 'likeComment';
    case 'REPLY_LIKE':
      return 'likeReply';
    case 'FEED_COMMENT':
      return 'comment';
    case 'FEED_REPLY':
      return 'reply';
    case 'NEIGHBOR_REQUEST':
      return 'neighbor';
    case 'FEED':
      return 'post';
    case 'STORY':
      return 'story';
    default:
      return null;
  }
}

function mapActivity(raw: unknown, index: number): ActivityItem | null {
  if (!isRecord(raw) || typeof raw.type !== 'string') return null;
  const kind = mapActivityType(raw.type);
  if (!kind) return null;
  const feedId = idString(raw.feedId);
  const commentId = idString(raw.feedCommentId);
  const replyId = idString(raw.feedReplyId);
  const storyId = idString(raw.storyId);
  const neighborId = idString(raw.neighborId);
  const occurredAt = typeof raw.occurredAt === 'string' ? raw.occurredAt : '';
  const month = monthOf(occurredAt);
  const snippet = typeof raw.snippet === 'string' ? raw.snippet.trim() : '';
  const nickname = typeof raw.targetNickname === 'string' ? raw.targetNickname.trim() : '';
  return {
    id: [raw.type, occurredAt, feedId, commentId, replyId, storyId, neighborId, index]
      .filter((part) => part != null && part !== '')
      .join('-'),
    kind,
    targetNickname: nickname,
    profileUrl: resolveFileDisplayUrl(asFile(raw.profileFile)) ?? NO_PROFILE_SRC,
    timeLabel: occurredAt ? formatActivityTime(occurredAt) : '',
    preview: snippet || undefined,
    feedId,
    commentId,
    replyId,
    storyId,
    neighborId,
    neighborPending: kind === 'neighbor' && raw.neighborStatus === 'PENDING' && Boolean(neighborId),
    monthKey: month.key,
    monthLabel: month.label,
  };
}

function unwrapItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  return [];
}

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

function shouldPreserveMentions(kind: ActivityKind) {
  return (
    kind === 'comment' ||
    kind === 'reply' ||
    kind === 'likeComment' ||
    kind === 'likeReply'
  );
}

function KeywordButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.keyword} onClick={onClick}>
      {label}
    </button>
  );
}

function goComment(item: ActivityItem, router: ReturnType<typeof useRouter>) {
  void openFeedComment(
    router,
    {
      feedId: item.feedId,
      commentId: item.commentId,
      replyId: item.replyId,
      feedOwnerNickname: item.targetNickname,
    },
    'comment',
  );
}

function goReply(item: ActivityItem, router: ReturnType<typeof useRouter>) {
  void openFeedComment(
    router,
    {
      feedId: item.feedId,
      commentId: item.commentId,
      replyId: item.replyId,
      feedOwnerNickname: item.targetNickname,
    },
    'reply',
  );
}

function goPost(item: ActivityItem, router: ReturnType<typeof useRouter>) {
  if (!item.feedId) return;
  router.push(postPagePath(item.feedId));
}

function goStory(item: ActivityItem, router: ReturnType<typeof useRouter>) {
  if (!item.storyId) return;
  router.push(`/stories/${item.storyId}`);
}

function ActivityMessage({ item }: { item: ActivityItem }) {
  const router = useRouter();
  const ultaryHref = item.targetNickname ? myUltaryPath(item.targetNickname) : '';
  const snippet = item.preview
    ? toPreviewSnippet(item.preview, 6, shouldPreserveMentions(item.kind))
    : null;

  const nick = item.targetNickname ? (
    <Link href={ultaryHref} className={styles.nickname}>
      {item.targetNickname}
    </Link>
  ) : null;

  const previewNode =
    snippet != null ? <span className={styles.preview}>&quot;{snippet}&quot;</span> : null;

  const time = <span className={styles.time}>{item.timeLabel}</span>;

  let action: ReactNode;
  switch (item.kind) {
    case 'like':
      action = (
        <>
          {nick}님의 <KeywordButton label="게시글" onClick={() => goPost(item, router)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'likeComment':
      action = (
        <>
          {nick}님의 <KeywordButton label="댓글" onClick={() => goComment(item, router)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'likeReply':
      action = (
        <>
          {nick}님의 <KeywordButton label="답글" onClick={() => goReply(item, router)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'comment':
      action = (
        <>
          {nick}님의 게시글에{' '}
          <KeywordButton label="댓글" onClick={() => goComment(item, router)} />을 남겼습니다.
        </>
      );
      break;
    case 'reply':
      action = (
        <>
          {nick}님의 댓글에 <KeywordButton label="답글" onClick={() => goReply(item, router)} />을
          남겼습니다.
        </>
      );
      break;
    case 'neighbor':
      action = <>{nick}님에게 이웃을 신청했습니다.</>;
      break;
    case 'post':
      action = (
        <>
          <KeywordButton label="게시글" onClick={() => goPost(item, router)} />을 올렸습니다.
        </>
      );
      break;
    case 'story':
      action = (
        <>
          <KeywordButton label="스토리" onClick={() => goStory(item, router)} />를 올렸습니다.
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

/** 설정 > 내 활동. GET /settings/activities */
export default function ActivityClient() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [status, setStatus] = useState('불러오는 중');
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.settings.activities, {
          limit: 30,
        });
        const mapped = unwrapItems(res.data)
          .map(mapActivity)
          .filter((item): item is ActivityItem => item != null);
        if (cancelled) return;
        setItems(mapped);
        setStatus(mapped.length === 0 ? '활동이 없습니다.' : '');
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setStatus(pickErrorMessage(err, '활동을 불러오지 못했습니다.'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function cancelNeighbor(item: ActivityItem) {
    if (!item.neighborId || cancelingId) return;
    setCancelingId(item.id);
    setStatus('');
    try {
      await bffDelete<BffEnvelope<unknown>>(bffEndpoints.users.neighborCancel, {
        neighborId: item.neighborId,
      });
      setItems((prev) => {
        const next = prev.filter((row) => row.id !== item.id);
        if (next.length === 0) setStatus('활동이 없습니다.');
        return next;
      });
    } catch (err) {
      setStatus(pickErrorMessage(err, '이웃 신청을 취소하지 못했습니다.'));
    } finally {
      setCancelingId(null);
    }
  }

  const groups = groupByMonth(items);

  return (
    <div className={styles.shell}>
      <PageHeader title="내 활동" backHref="/settings" />

      <main className={styles.main}>
        {status ? <p className={styles.status}>{status}</p> : null}
        {groups.map((group) => (
          <section key={group.key} className={styles.month}>
            {group.label ? <h2 className={styles.monthTitle}>{group.label}</h2> : null}
            <ul className={styles.list}>
              {group.items.map((item) => {
                const ultaryHref = item.targetNickname ? myUltaryPath(item.targetNickname) : '';
                const showCancel = item.neighborPending;

                return (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.itemBody}>
                      {ultaryHref ? (
                        <Link
                          href={ultaryHref}
                          className={styles.imageWrap}
                          aria-label={`${item.targetNickname} 울타리`}
                        >
                          <MediaImage
                            src={item.profileUrl}
                            alt=""
                            width={39}
                            height={39}
                            className={styles.image}
                          />
                        </Link>
                      ) : (
                        <span className={styles.imageWrap}>
                          <MediaImage
                            src={item.profileUrl}
                            alt=""
                            width={39}
                            height={39}
                            className={styles.image}
                          />
                        </span>
                      )}
                      <div className={styles.info}>
                        <ActivityMessage item={item} />
                      </div>
                      {showCancel ? (
                        <div className={styles.actionWrap}>
                          <button
                            type="button"
                            className={clsx(styles.actionBtn, styles.actionCancel)}
                            disabled={cancelingId === item.id}
                            onClick={() => void cancelNeighbor(item)}
                          >
                            취소
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <FooterMenu />
    </div>
  );
}
