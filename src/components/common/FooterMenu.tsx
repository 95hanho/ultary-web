'use client';

import { Profile } from '@/components/my-ultary/Profile';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const isHome = pathname === '/';
  const isSearch = pathname.startsWith('/search');
  const isNotifications = pathname.startsWith('/notifications');
  const isDm = pathname.startsWith('/dm');
  const isMyUltary = pathname.startsWith('/my-ultary');

  return (
    <nav className={styles.footer} aria-label="하단 메뉴">
      <Link
        href="/"
        className={styles.item}
        aria-label="홈"
        aria-current={isHome ? 'page' : undefined}
      >
        <Image src={isHome ? HomeFillIcon : HomeIcon} alt="" width={33} height={33} />
      </Link>

      <Link
        href="/search"
        className={styles.item}
        aria-label="검색"
        aria-current={isSearch ? 'page' : undefined}
      >
        <Image src={isSearch ? SearchFillIcon : SearchIcon} alt="" width={30} height={30} />
      </Link>

      <Link
        href="/notifications"
        className={styles.item}
        aria-label="알림"
        aria-current={isNotifications ? 'page' : undefined}
      >
        <Image src={isNotifications ? BellFillIcon : BellIcon} alt="" width={30} height={30} />
      </Link>

      <Link
        href="/dm"
        className={styles.item}
        aria-label="메시지"
        aria-current={isDm ? 'page' : undefined}
      >
        <Image src={isDm ? MessageFillIcon : MessageIcon} alt="" width={30} height={30} />
      </Link>

      <Link
        href="/my-ultary"
        className={styles.item}
        aria-label="마이울타리"
        aria-current={isMyUltary ? 'page' : undefined}
      >
        <Profile imageUrl={PROFILE_SRC} size={35} />
      </Link>
    </nav>
  );
}
