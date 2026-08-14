'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Profile } from '@/components/my-ultary/Profile';
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

type NavItem = {
  href: string;
  label: string;
  icon: string;
  activeIcon: string;
};

const NAV: NavItem[] = [
  { href: '/', label: '홈', icon: HomeIcon, activeIcon: HomeFillIcon },
  {
    href: '/search',
    label: '검색',
    icon: SearchIcon,
    activeIcon: SearchFillIcon,
  },
  {
    href: '/notifications',
    label: '알림',
    icon: BellIcon,
    activeIcon: BellFillIcon,
  },
  {
    href: '/dm',
    label: '메시지',
    icon: MessageIcon,
    activeIcon: MessageFillIcon,
  },
];

/** 하단 공통 메뉴바 */
export function FooterMenu() {
  const pathname = usePathname();

  return (
    <nav className={styles.footer} aria-label="하단 메뉴">
      {NAV.map((item) => {
        const active =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.item}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            <Image
              src={active ? item.activeIcon : item.icon}
              alt=""
              width={26}
              height={26}
            />
          </Link>
        );
      })}

      <Link
        href="/my-ultary"
        className={styles.item}
        aria-label="마이울타리"
        aria-current={pathname.startsWith('/my-ultary') ? 'page' : undefined}
      >
        <Profile imageUrl={PROFILE_SRC} size={28} />
      </Link>
    </nav>
  );
}
