'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import clsx from 'clsx';
import Image from 'next/image';
import styles from './notifications.module.scss';

const BOTTOM_BG = '/images/ultary_bg_bt.png';

type NotificationAction = 'accept' | 'cancel';

type NotificationItem = {
  id: string;
  nickname: string;
  imageUrl: string;
  message: string;
  timeLabel: string;
  action: NotificationAction;
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    nickname: 'LEE_OKJU',
    imageUrl: '/images/mock/profile.jpg',
    message: '님이 나와의 이웃을 신청했습니다.',
    timeLabel: '8월29일 15:59',
    action: 'accept',
  },
  {
    id: 'n2',
    nickname: 'LEE_OKJU',
    imageUrl: '/images/mock/profile.jpg',
    message: '님이 나와의 이웃을 신청했습니다.',
    timeLabel: '8월29일 15:59',
    action: 'cancel',
  },
  {
    id: 'n3',
    nickname: 'LEE_OKJU',
    imageUrl: '/images/mock/profile.jpg',
    message: '님이 나와의 이웃을 신청했습니다.',
    timeLabel: '8월29일 15:59',
    action: 'accept',
  },
  {
    id: 'n4',
    nickname: 'LEE_OKJU',
    imageUrl: '/images/mock/profile.jpg',
    message: '님이 나와의 이웃을 신청했습니다.',
    timeLabel: '8월29일 15:59',
    action: 'cancel',
  },
  {
    id: 'n5',
    nickname: 'LEE_OKJU',
    imageUrl: '/images/mock/profile.jpg',
    message: '님이 나와의 이웃을 신청했습니다.',
    timeLabel: '8월29일 15:59',
    action: 'accept',
  },
  {
    id: 'n6',
    nickname: 'LEE_OKJU',
    imageUrl: '/images/mock/profile.jpg',
    message: '님이 나와의 이웃을 신청했습니다.',
    timeLabel: '8월29일 15:59',
    action: 'cancel',
  },
];

/** 알림 페이지 */
export default function NotificationsClient() {
  return (
    <div className={styles.shell}>
      <PageHeader title="알림" />

      <main className={styles.main}>
        <ul className={styles.list}>
          {MOCK_NOTIFICATIONS.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.itemBody}>
                <span className={styles.imageWrap}>
                  <Image
                    src={item.imageUrl}
                    alt=""
                    width={47}
                    height={47}
                    className={styles.image}
                  />
                </span>
                <div className={styles.text}>
                  <p className={styles.message}>
                    <strong className={styles.nickname}>{item.nickname}</strong>
                    {item.message}
                  </p>
                  <p className={styles.time}>{item.timeLabel}</p>
                </div>
                <div className={styles.actionWrap}>
                  <button
                    type="button"
                    className={clsx(
                      styles.actionBtn,
                      item.action === 'accept' ? styles.actionAccept : styles.actionCancel,
                    )}
                  >
                    {item.action === 'accept' ? '수락' : '취소'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Image src={BOTTOM_BG} alt="" width={430} height={120} className={styles.bottomBg} />
      </main>

      <FooterMenu />
    </div>
  );
}
