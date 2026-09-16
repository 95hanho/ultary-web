'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { MY_NICKNAME, OTHER_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import styles from './activity.module.scss';

const MY_PROFILE = '/images/mock/profile.jpg';
const OTHER_PROFILE = '/images/mock/feed.jpg';

type ActivityKind =
  | 'like'
  | 'likeComment'
  | 'likeReply'
  | 'comment'
  | 'reply'
  | 'neighbor'
  | 'post'
  | 'story';

type NeighborAction = 'cancel' | 'accept';

type ActivityItem = {
  id: string;
  kind: ActivityKind;
  /** 상대 닉네임 (내 게시글/스토리는 내 닉네임) */
  targetNickname: string;
  profileUrl: string;
  timeLabel: string;
  /** 댓글/게시글 원문 (줄바꿈 제거·6자 스니펫) */
  preview?: string;
  feedId?: string;
  commentId?: string;
  replyId?: string;
  storyId?: string;
  /** 이웃 신청: 취소(대기중) / 수락(재신청) */
  neighborAction?: NeighborAction;
};

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'a1',
    kind: 'like',
    targetNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: '오늘도 산책 나왔어요~',
    timeLabel: '8월29일 15:59',
    feedId: '1',
  },
  {
    id: 'a1b',
    kind: 'likeComment',
    targetNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: `@${MY_NICKNAME} 귀여워요\nㅎㅎ`,
    timeLabel: '8월29일 16:05',
    feedId: '2',
    commentId: 'c-12',
  },
  {
    id: 'a1c',
    kind: 'likeReply',
    targetNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: `@${MY_NICKNAME} 맞아요\n완전!`,
    timeLabel: '8월29일 16:12',
    feedId: '2',
    commentId: 'c-12',
    replyId: 'r-3',
  },
  {
    id: 'a2',
    kind: 'comment',
    targetNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: `@${MY_NICKNAME} 아\n메\n리\n카\n노 맛있겠다!`,
    timeLabel: '8월29일 15:59',
    feedId: '2',
    commentId: 'c-12',
  },
  {
    id: 'a2b',
    kind: 'reply',
    targetNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    preview: `@${OTHER_NICKNAME} 저도\n동의해요!`,
    timeLabel: '8월29일 16:20',
    feedId: '2',
    commentId: 'c-12',
    replyId: 'r-3',
  },
  {
    id: 'a3',
    kind: 'neighbor',
    targetNickname: OTHER_NICKNAME,
    profileUrl: OTHER_PROFILE,
    timeLabel: '8월28일 21:10',
    neighborAction: 'cancel',
  },
  {
    id: 'a4',
    kind: 'post',
    targetNickname: MY_NICKNAME,
    profileUrl: MY_PROFILE,
    preview: '머하\n냥 저녁 메뉴',
    timeLabel: '8월28일 18:40',
    feedId: '3',
  },
  {
    id: 'a5',
    kind: 'story',
    targetNickname: MY_NICKNAME,
    profileUrl: MY_PROFILE,
    preview: '해질녘 공원',
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

function logCommentNav(item: ActivityItem) {
  console.log('[activity] 해당댓글로이동', {
    feedId: item.feedId,
    commentId: item.commentId,
  });
}

function logReplyNav(item: ActivityItem) {
  console.log('[activity] 해당답글로이동', {
    feedId: item.feedId,
    commentId: item.commentId,
    replyId: item.replyId,
  });
}

function ActivityMessage({ item }: { item: ActivityItem }) {
  const router = useRouter();
  const ultaryHref = myUltaryPath(item.targetNickname);
  const snippet = item.preview
    ? toPreviewSnippet(item.preview, 6, shouldPreserveMentions(item.kind))
    : null;

  const nick = (
    <Link href={ultaryHref} className={styles.nickname}>
      {item.targetNickname}
    </Link>
  );

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
          {nick}님의 <KeywordButton label="댓글" onClick={() => logCommentNav(item)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'likeReply':
      action = (
        <>
          {nick}님의 <KeywordButton label="답글" onClick={() => logReplyNav(item)} />에
          좋아요를 눌렀습니다.
        </>
      );
      break;
    case 'comment':
      action = (
        <>
          {nick}님의 게시글에{' '}
          <KeywordButton label="댓글" onClick={() => logCommentNav(item)} />을 남겼습니다.
        </>
      );
      break;
    case 'reply':
      action = (
        <>
          {nick}님의 댓글에 <KeywordButton label="답글" onClick={() => logReplyNav(item)} />을
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

function goPost(item: ActivityItem, router: ReturnType<typeof useRouter>) {
  if (!item.feedId) return;
  router.push(`${myUltaryPath(item.targetNickname)}/posts/${item.feedId}`);
}

function goStory(item: ActivityItem, router: ReturnType<typeof useRouter>) {
  console.log('[activity] 해당스토리로이동', item.storyId);
  router.push('/stories');
}

/** 설정 > 내 활동 */
export default function ActivityClient() {
  const [items, setItems] = useState(INITIAL_ACTIVITIES);

  function toggleNeighbor(id: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.kind !== 'neighbor') return item;
        const next: NeighborAction = item.neighborAction === 'cancel' ? 'accept' : 'cancel';
        console.log('[activity] 이웃신청', { id, action: next });
        return { ...item, neighborAction: next };
      }),
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="내 활동" backHref="/settings" />

      <main className={styles.main}>
        <ul className={styles.list}>
          {items.map((item) => {
            const ultaryHref = myUltaryPath(item.targetNickname);
            const isNeighbor = item.kind === 'neighbor';
            const neighborAccept = item.neighborAction === 'accept';

            return (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemBody}>
                  <Link
                    href={ultaryHref}
                    className={styles.imageWrap}
                    aria-label={`${item.targetNickname} 울타리`}
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
                    <ActivityMessage item={item} />
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
