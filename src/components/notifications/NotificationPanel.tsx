'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { MY_NICKNAME, OTHER_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import Image from 'next/image';
import Link from 'next/link';
import styles from './NotificationPanel.module.scss';

type PanelItem = {
  id: string;
  nickname: string;
  profileUrl: string;
  message: string;
  timeLabel: string;
};

const MOCK_PANEL_ITEMS: PanelItem[] = [
  {
    id: 'np1',
    nickname: OTHER_NICKNAME,
    profileUrl: '/images/mock/post_ex.jpg',
    message: '님이 회원님의 게시물에 좋아요를 눌렀습니다.',
    timeLabel: '2분',
  },
  {
    id: 'np2',
    nickname: 'mina_walk',
    profileUrl: '/images/mock/feed.jpg',
    message: '님이 댓글을 남겼습니다.',
    timeLabel: '1시간',
  },
  {
    id: 'np3',
    nickname: MY_NICKNAME,
    profileUrl: '/images/mock/feed.jpg',
    message: '스토리 공감이 도착했습니다.',
    timeLabel: '어제',
  },
];

/** 알림 본문 UI — 모바일 페이지 / 데스크톱 모달에서 공통 사용 */
export function NotificationPanel({ compact = false }: { compact?: boolean }) {
  if (MOCK_PANEL_ITEMS.length === 0) {
    return (
      <EmptyState
        title="알림이 없어요"
        description="새로운 활동이 생기면 여기에 표시돼요."
      />
    );
  }

  return (
    <div className={compact ? styles.compact : styles.root}>
      <ul className={styles.list}>
        {MOCK_PANEL_ITEMS.map((item) => (
          <li key={item.id} className={styles.item}>
            <Link
              href={myUltaryPath(item.nickname)}
              className={styles.avatar}
              aria-label={`${item.nickname} 울타리`}
            >
              <Image
                src={item.profileUrl}
                alt=""
                width={40}
                height={40}
                className={styles.avatarImg}
              />
            </Link>
            <div className={styles.body}>
              <p className={styles.text}>
                <Link
                  href={myUltaryPath(item.nickname)}
                  className={styles.nick}
                >
                  {item.nickname}
                </Link>
                {item.message}
              </p>
              <span className={styles.time}>{item.timeLabel}</span>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/notifications" className={styles.more}>
        전체 알림 보기
      </Link>
    </div>
  );
}
