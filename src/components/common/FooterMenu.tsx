'use client';

import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import {
  fetchUnreadCount,
  getUnreadBadge,
  publishUnreadBadge,
  subscribeUnreadBadge,
} from '@/lib/notification/unreadBadge';
import {
  fetchDmUnread,
  getDmUnreadBadge,
  subscribeDmUnread,
} from '@/lib/dm/unreadBadge';
import { isLiveSocketAuthed } from '@/lib/ws/liveSocket';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { confirmLeaveWrite, isWriteFlowPath } from '@/lib/write/confirm-leave';
import type { BffEnvelope, MeResponse } from '@/types/api';
import clsx from 'clsx';
import { MediaImage } from '@/components/common/MediaImage';
import Image from 'next/image';
import Link from 'next/link';
import { subscribeFooterNotice } from '@/lib/ui/footerNotice';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import styles from './FooterMenu.module.scss';

const NOTICE_ENTER_MS = 280;
const NOTICE_HOLD_MS = 2000;
const NOTICE_EXIT_MS = 280;

function FooterNotice() {
  const [message, setMessage] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const tokenRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const framesRef = useRef<number[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
      for (const id of framesRef.current) window.cancelAnimationFrame(id);
      framesRef.current = [];
    };
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    const unsubscribe = subscribeFooterNotice((next) => {
      const token = tokenRef.current + 1;
      tokenRef.current = token;
      clearTimers();
      setMessage(next);
      setShown(false);
      const first = window.requestAnimationFrame(() => {
        const second = window.requestAnimationFrame(() => {
          if (tokenRef.current !== token) return;
          setShown(true);
          later(() => {
            if (tokenRef.current !== token) return;
            setShown(false);
            later(() => {
              if (tokenRef.current !== token) return;
              setMessage(null);
            }, NOTICE_EXIT_MS);
          }, NOTICE_ENTER_MS + NOTICE_HOLD_MS);
        });
        framesRef.current.push(second);
      });
      framesRef.current.push(first);
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, []);

  if (!message) return null;

  return (
    <div className={styles.noticeHost} aria-live="polite">
      <p className={clsx(styles.notice, shown && styles.noticeShown)}>{message}</p>
    </div>
  );
}

const HomeIcon = '/images/icon/Home.svg';
const HomeFillIcon = '/images/icon/Home_fill.svg';
const SearchIcon = '/images/icon/Search.svg';
const SearchFillIcon = '/images/icon/Search_fill.svg';
const BellIcon = '/images/icon/Bell.svg';
const BellFillIcon = '/images/icon/Bell_fill.svg';
const MessageIcon = '/images/icon/Message.svg';
const MessageFillIcon = '/images/icon/Message_fill.svg';
let cachedAvatarSrc: string | null = null;

function unreadBadgeLabel(count: number) {
  if (count >= 10) return '9+';
  return String(count);
}

/** 하단 공통 메뉴바 */
export function FooterMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const myPath = myUltaryPath(MY_NICKNAME);
  const [avatarSrc, setAvatarSrc] = useState(NO_PROFILE_SRC);
  const [unreadCount, setUnreadCount] = useState(getUnreadBadge);
  const [dmUnreadCount, setDmUnreadCount] = useState(getDmUnreadBadge);
  const isNotifications = pathname.startsWith('/notifications');

  useEffect(() => {
    if (cachedAvatarSrc) {
      setAvatarSrc(cachedAvatarSrc);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
        const url = resolveFileDisplayUrl(res.data?.profileFile);
        if (!url || cancelled) return;
        cachedAvatarSrc = url;
        setAvatarSrc(url);
      } catch (err) {
        console.error('[footer] me profile failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeUnreadBadge(setUnreadCount), []);
  useEffect(() => subscribeDmUnread(setDmUnreadCount), []);

  useEffect(() => {
    if (isNotifications) return;
    let cancelled = false;
    void fetchUnreadCount()
      .then((count) => {
        if (!cancelled && !isLiveSocketAuthed()) publishUnreadBadge(count);
      })
      .catch((err) => {
        if (!cancelled) console.error('[footer] unread count failed', err);
      });
    return () => {
      cancelled = true;
    };
  }, [isNotifications]);

  useEffect(() => {
    let cancelled = false;
    void fetchDmUnread().catch((err) => {
      if (!cancelled) console.error('[footer] dm unread failed', err);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);
  const writing = isWriteFlowPath(pathname);
  const isHome = pathname === '/';
  const isSearch = pathname.startsWith('/search');
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
      <FooterNotice />
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
        aria-label={
          unreadCount != null && unreadCount > 0
            ? `알림 ${unreadBadgeLabel(unreadCount)}`
            : '알림'
        }
        aria-current={isNotifications ? 'page' : undefined}
        onClick={guardNav('/notifications')}
      >
        <span className={styles.iconWrap}>
          <Image src={isNotifications ? BellFillIcon : BellIcon} alt="" width={30} height={30} />
          {unreadCount != null && unreadCount > 0 ? (
            <span className={styles.badge} aria-hidden>
              {unreadBadgeLabel(unreadCount)}
            </span>
          ) : null}
        </span>
      </Link>

      <Link
        href="/dm"
        className={styles.item}
        aria-label={
          dmUnreadCount != null && dmUnreadCount > 0
            ? `메시지 ${unreadBadgeLabel(dmUnreadCount)}`
            : '메시지'
        }
        aria-current={isDm ? 'page' : undefined}
        onClick={guardNav('/dm')}
      >
        <span className={styles.iconWrap}>
          <Image src={isDm ? MessageFillIcon : MessageIcon} alt="" width={30} height={30} />
          {dmUnreadCount != null && dmUnreadCount > 0 ? (
            <span className={styles.badge} aria-hidden>
              {unreadBadgeLabel(dmUnreadCount)}
            </span>
          ) : null}
        </span>
      </Link>

      <Link
        href={myPath}
        className={styles.item}
        aria-label="마이울타리"
        aria-current={isMyUltary ? 'page' : undefined}
        onClick={guardNav(myPath)}
      >
        <MediaImage
          src={avatarSrc}
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
