'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import {
  Ban,
  Bell,
  Eye,
  FileText,
  HelpCircle,
  Info,
  List,
  PawPrint,
  Shield,
  User,
  UserMinus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from './settings.module.scss';

const ArrowRightIcon = '/images/icon/arrow_right.svg';
const MY_ULTARY = myUltaryPath();

type MenuItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    title: '계정',
    items: [
      { label: '마이페이지', href: MY_ULTARY, Icon: User },
      { label: '반려동물 관리', href: MY_ULTARY, Icon: PawPrint },
      { label: '계정 / 보안', href: '#', Icon: Shield },
      { label: '회원탈퇴', href: '#', Icon: UserMinus },
    ],
  },
  {
    title: '활동 · 관계',
    items: [
      { label: '내 활동', href: '#', Icon: List },
      { label: '주민 · 이웃 관리', href: '#', Icon: Users },
      { label: '차단한 사용자', href: '#', Icon: Ban },
    ],
  },
  {
    title: '알림 · 공개',
    items: [
      { label: '알림 설정', href: '#', Icon: Bell },
      { label: '공개 범위', href: '#', Icon: Eye },
    ],
  },
  {
    title: '기타',
    items: [
      { label: '고객센터 / 문의', href: '#', Icon: HelpCircle },
      { label: '이용약관 · 개인정보처리방침', href: '#', Icon: FileText },
      { label: '앱 정보', href: '#', Icon: Info },
    ],
  },
];

/** 설정 페이지 */
export default function SettingsClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLogout() {
    setError(null);
    startTransition(async () => {
      try {
        await bffPostJson(bffEndpoints.auth.logout);
      } catch (err) {
        console.error('[logout]', err);
        setError('로그아웃 요청 실패(쿠키는 BFF에서 지웠을 수 있음)');
      }
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="설정" />

      <main className={styles.main}>
        {MENU_GROUPS.map((group) => (
          <section key={group.title} className={styles.group}>
            <h2 className={styles.groupTitle}>{group.title}</h2>
            <ul className={styles.menuList}>
              {group.items.map(({ label, href, Icon }) => (
                <li key={label}>
                  <Link href={href} className={styles.menuItem}>
                    <span className={styles.menuLeft}>
                      <span className={styles.menuIcon} aria-hidden>
                        <Icon size={30} strokeWidth={1.6} />
                      </span>
                      <span className={styles.menuLabel}>{label}</span>
                    </span>
                    <Image
                      src={ArrowRightIcon}
                      alt=""
                      width={9}
                      height={14}
                      className={styles.menuArrow}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <button
          type="button"
          className={styles.logout}
          disabled={pending}
          onClick={handleLogout}
        >
          {pending ? '로그아웃 중…' : '로그아웃'}
        </button>
        {error ? <p className={styles.error}>{error}</p> : null}
      </main>

      <FooterMenu />
    </div>
  );
}
