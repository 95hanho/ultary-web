'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { OTHER_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import styles from './blocked.module.scss';

const PROFILE = '/images/mock/profile.jpg';

type BlockAction = 'unblock' | 'cancel';

type BlockedUser = {
  id: string;
  nickname: string;
  profileUrl: string;
  blockedAtLabel: string;
  /** unblock=차단해제(회색), cancel=취소(blue-600) */
  action: BlockAction;
};

const INITIAL_BLOCKED: BlockedUser[] = [
  {
    id: 'b1',
    nickname: OTHER_NICKNAME,
    profileUrl: PROFILE,
    blockedAtLabel: '8월29일 15:59',
    action: 'unblock',
  },
  {
    id: 'b2',
    nickname: OTHER_NICKNAME,
    profileUrl: PROFILE,
    blockedAtLabel: '8월29일 15:59',
    action: 'cancel',
  },
  {
    id: 'b3',
    nickname: OTHER_NICKNAME,
    profileUrl: PROFILE,
    blockedAtLabel: '8월29일 15:59',
    action: 'unblock',
  },
];

/** 설정 > 차단한 사용자 */
export default function BlockedClient() {
  const [items, setItems] = useState(INITIAL_BLOCKED);

  function toggleAction(id: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next: BlockAction = item.action === 'unblock' ? 'cancel' : 'unblock';
        console.log('[blocked]', { id, nickname: item.nickname, action: next });
        return { ...item, action: next };
      }),
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="차단한 사용자" backHref="/settings" />

      <main className={styles.main}>
        <ul className={styles.list}>
          {items.map((item) => {
            const ultaryHref = myUltaryPath(item.nickname);
            const showCancel = item.action === 'cancel';

            return (
              <li key={item.id} className={styles.item}>
                <div className={styles.itemBody}>
                  <Link
                    href={ultaryHref}
                    className={styles.imageWrap}
                    aria-label={`${item.nickname} 울타리`}
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
                    <Link href={ultaryHref} className={styles.nickname}>
                      {item.nickname}
                    </Link>
                    <span className={styles.time}>{item.blockedAtLabel}</span>
                  </div>
                  <div className={styles.actionWrap}>
                    <button
                      type="button"
                      className={clsx(
                        styles.actionBtn,
                        showCancel ? styles.actionBlue : styles.actionGray,
                      )}
                      onClick={() => toggleAction(item.id)}
                    >
                      {showCancel ? '취소' : '차단해제'}
                    </button>
                  </div>
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
