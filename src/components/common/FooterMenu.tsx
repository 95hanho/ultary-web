'use client';

import { MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import { confirmLeaveWrite, isWriteFlowPath } from '@/lib/write/confirm-leave';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import styles from './FooterMenu.module.scss';

const HomeIcon = '/images/icon/Home.svg';
const HomeFillIcon = '/images/icon/Home_fill.svg';
const SearchIcon = '/images/icon/Search.svg';
const SearchFillIcon = '/images/icon/Search_fill.svg';
const BellIcon = '/images/icon/Bell.svg';
const BellFillIcon = '/images/icon/Bell_fill.svg';
const MessageIcon = '/images/icon/Message.svg';
const MessageFillIcon = '/images/icon/Message_fill.svg';
const PROFILE_SRC = '/images/mock/profile.jpg';

/** 하단 공통 메뉴바 */
export function FooterMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const myPath = myUltaryPath(MY_NICKNAME);
  const writing = isWriteFlowPath(pathname);
  const isHome = pathname === '/';
  const isSearch = pathname.startsWith('/search');
  const isNotifications = pathname.startsWith('/notifications');
  const isDm = pathname.startsWith('/dm');
  /** 내 울타리(/myultary/{내닉네임})일 때만 활성 — 타인 울타리 조회 시 off */
  const isMyUltary = pathname === myPath || pathname.startsWith(`${myPath}/`);

  const guardNav = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!writing) return;
    e.preventDefault();
    if (pathname === href) return;
    confirmLeaveWrite(() => {
      router.push(href);
    });
  };

  return (
    <nav className={styles.footer} aria-label="하단 메뉴">
      <Link
        href="/"
        className={styles.item}
        aria-label="홈"
        aria-current={isHome ? 'page' : undefined}
        onClick={guardNav('/')}
      >
        <Image src={isHome ? HomeFillIcon : HomeIcon} alt="" width={33} height={33} />
      </Link>

      <Link
        href="/search"
        className={styles.item}
        aria-label="검색"
        aria-current={isSearch ? 'page' : undefined}
        onClick={guardNav('/search')}
      >
        <Image src={isSearch ? SearchFillIcon : SearchIcon} alt="" width={30} height={30} />
      </Link>

      <Link
        href="/notifications"
        className={styles.item}
        aria-label="알림"
        aria-current={isNotifications ? 'page' : undefined}
        onClick={guardNav('/notifications')}
      >
        <Image src={isNotifications ? BellFillIcon : BellIcon} alt="" width={30} height={30} />
      </Link>

      <Link
        href="/dm"
        className={styles.item}
        aria-label="메시지"
        aria-current={isDm ? 'page' : undefined}
        onClick={guardNav('/dm')}
      >
        <Image src={isDm ? MessageFillIcon : MessageIcon} alt="" width={30} height={30} />
      </Link>

      <Link
        href={myPath}
        className={styles.item}
        aria-label="마이울타리"
        aria-current={isMyUltary ? 'page' : undefined}
        onClick={guardNav(myPath)}
      >
        <Image
          src={PROFILE_SRC}
          alt=""
          width={35}
          height={35}
          className={clsx(
            styles.myUltaryAvatar,
            isMyUltary && styles.myUltaryAvatarActive,
          )}
        />
      </Link>
    </nav>
  );
}
