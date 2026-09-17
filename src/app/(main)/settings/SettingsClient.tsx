'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import {
  Ban,
  Bell,
  Eye,
  FileText,
  HelpCircle,
  Info,
  List,
  PawPrint,
  // Shield, // 계정/보안 메뉴 복구 시 함께 해제
  User,
  UserMinus,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import styles from './settings.module.scss';

const ArrowRightIcon = '/images/icon/arrow_right.svg';

/** 커밋 ~30개대 초반 기능 확장 단계 기준 */
const APP_VERSION = '0.3.2';

type MenuItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  /** 페이지 이동 대신 펼침 */
  accordion?: 'appInfo';
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    title: '계정',
    items: [
      { label: '마이페이지', href: '/settings/mypage', Icon: User },
      { label: '반려동물 관리', href: '/settings/pets', Icon: PawPrint },
      // 마이페이지에서 비밀번호·회원정보 수정 가능 — 계정/보안 메뉴는 미사용
      // { label: '계정 / 보안', href: '#', Icon: Shield },
      { label: '회원탈퇴', href: '/settings/withdraw', Icon: UserMinus },
    ],
  },
  {
    title: '활동 · 관계',
    items: [
      { label: '내 활동', href: '/settings/activity', Icon: List },
      { label: '차단한 사용자', href: '/settings/blocked', Icon: Ban },
    ],
  },
  {
    title: '알림 · 공개',
    items: [
      { label: '알림 설정', href: '/settings/notifications', Icon: Bell },
      { label: '공개 범위', href: '/settings/privacy', Icon: Eye },
    ],
  },
  {
    title: '기타',
    items: [
      { label: '고객센터 / 문의', href: '#', Icon: HelpCircle },
      { label: '이용약관 · 개인정보처리방침', href: '/settings/terms', Icon: FileText },
      { label: '앱 정보', href: '#', Icon: Info, accordion: 'appInfo' },
    ],
  },
];

/** 설정 페이지 */
export default function SettingsClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [appInfoOpen, setAppInfoOpen] = useState(false);

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
              {group.items.map(({ label, href, Icon, accordion }) => (
                <li key={label}>
                  {accordion === 'appInfo' ? (
                    <div className={styles.accordion}>
                      <button
                        type="button"
                        className={styles.menuItemBtn}
                        aria-expanded={appInfoOpen}
                        onClick={() => setAppInfoOpen((v) => !v)}
                      >
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
                          className={clsx(
                            styles.menuArrow,
                            styles.menuArrowDown,
                            appInfoOpen && styles.menuArrowUp,
                          )}
                        />
                      </button>
                      <div
                        className={clsx(styles.accordionPanel, appInfoOpen && styles.accordionPanelOpen)}
                        aria-hidden={!appInfoOpen}
                      >
                        <div className={styles.accordionInner}>
                          <p className={styles.appInfoRow}>
                            <span className={styles.appInfoLabel}>앱 버전</span>
                            <span className={styles.appInfoValue}>{APP_VERSION}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}
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
