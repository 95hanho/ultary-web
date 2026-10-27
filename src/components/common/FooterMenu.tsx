'use client';
import { useHydrated } from '@/lib/react/useHydrated';
import { useResettableState } from '@/lib/react/useResettableState';

import { MediaImage } from '@/components/common/MediaImage';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { fetchDmUnread, getDmUnreadBadge, subscribeDmUnread } from '@/lib/dm/unreadBadge';
import { MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import {
  fetchUnreadCount,
  getUnreadBadge,
  publishUnreadBadge,
  subscribeUnreadBadge,
} from '@/lib/notification/unreadBadge';
import { readFileAsDataUrl } from '@/lib/pending-pet-photo';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { subscribeFooterNotice } from '@/lib/ui/footerNotice';
import { confirmLeaveWrite, isWriteFlowPath } from '@/lib/write/confirm-leave';
import { isLiveSocketAuthed } from '@/lib/ws/liveSocket';
import { useModalStore } from '@/stores/modal.store';
import { useStoryDraftStore } from '@/stores/story-draft.store';
import { useWriteDraftStore } from '@/stores/write-draft.store';
import type { BffEnvelope, MeResponse } from '@/types/api';
import clsx from 'clsx';
import { Bookmark, Fence, List, LogOut, Menu, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './FooterMenu.module.scss';
import { PcNotificationDrawer } from './PcNotificationDrawer';

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

  return createPortal(
    <div className={styles.noticeHost} aria-live="polite">
      <p className={clsx(styles.notice, shown && styles.noticeShown)}>{message}</p>
    </div>,
    document.body,
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
const AddIcon = '/images/icon/Add_round.svg';
const LogoImage = '/images/img/ultary_logo.png';

let cachedAvatarSrc: string | null = null;
let cachedNickname: string | null = null;
const profileRefreshListeners = new Set<() => void>();

/** 대표 반려동물 변경 후 캐시를 비우고 현재 메뉴의 프로필을 다시 조회한다. */
export function refreshFooterProfile() {
  cachedAvatarSrc = null;
  cachedNickname = null;
  for (const refresh of profileRefreshListeners) refresh();
}
/** 알림 페이지에서 PC로 넓어질 때, 메인으로 이동한 뒤 팝업을 연다 */
let openNoticeAfterNav = false;

function unreadBadgeLabel(count: number) {
  if (count >= 10) return '9+';
  return String(count);
}

function isDesktopNav() {
  return window.matchMedia('(min-width: 768px)').matches;
}

export function FooterMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);
  const clearWriteDraft = useWriteDraftStore((s) => s.clear);
  const setWriteItems = useWriteDraftStore((s) => s.setItems);
  const clearStoryDraft = useStoryDraftStore((s) => s.clear);
  const setStoryMedia = useStoryDraftStore((s) => s.setMedia);
  const [avatarSrc, setAvatarSrc] = useState(cachedAvatarSrc ?? NO_PROFILE_SRC);
  const [nickname, setNickname] = useState(cachedNickname ?? MY_NICKNAME);
  const [unreadCount, setUnreadCount] = useState(getUnreadBadge);
  const [dmUnreadCount, setDmUnreadCount] = useState(getDmUnreadBadge);
  const hydrated = useHydrated();
  const [noticeOpen, setNoticeOpen] = useResettableState(hydrated && openNoticeAfterNav, [
    hydrated,
  ]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePlace, setMorePlace] = useState<{ left: number; bottom: number } | null>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const writeFileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  const myPath = myUltaryPath(nickname);
  const isHome = pathname === '/';
  const isSearch = pathname === '/search' || pathname.startsWith('/search/');
  const isNotifications = pathname === '/notifications' || pathname.startsWith('/notifications/');
  const isDm = pathname === '/dm' || pathname.startsWith('/dm/');
  const isMyUltary = pathname === myPath || pathname.startsWith(`${myPath}/`);

  const guardNav = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    setNoticeOpen(false);
    setMoreOpen(false);
    if (!isWriteFlowPath(pathname) || pathname === href) return;
    event.preventDefault();
    confirmLeaveWrite(() => router.push(href));
  };

  useEffect(() => {
    if (!hydrated || !openNoticeAfterNav) return;
    const id = window.setTimeout(() => {
      openNoticeAfterNav = false;
    }, 0);
    return () => window.clearTimeout(id);
  }, [hydrated]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const openNoticeOnDesktop = () => {
      if (!desktop.matches) return;
      if (pathname !== '/notifications' && !pathname.startsWith('/notifications/')) return;
      openNoticeAfterNav = true;
      router.replace('/');
    };
    desktop.addEventListener('change', openNoticeOnDesktop);
    return () => desktop.removeEventListener('change', openNoticeOnDesktop);
  }, [pathname, router]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const closeOnMobile = () => {
      if (!mq.matches) return;
      setNoticeOpen(false);
      setMoreOpen(false);
    };
    mq.addEventListener('change', closeOnMobile);
    return () => mq.removeEventListener('change', closeOnMobile);
  }, [setNoticeOpen]);

  useEffect(() => {
    let cancelled = false;
    let requestId = 0;
    const refresh = async () => {
      const currentRequest = ++requestId;
      try {
        const res = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
        if (cancelled || currentRequest !== requestId) return;
        const url = resolveFileDisplayUrl(res.data?.profileFile) ?? NO_PROFILE_SRC;
        cachedAvatarSrc = url;
        setAvatarSrc(url);
        const nextName = res.data?.nickname?.trim();
        if (nextName) {
          cachedNickname = nextName;
          setNickname(nextName);
        }
      } catch (err) {
        console.error('[footer] me profile failed', err);
      }
    };
    const onRefresh = () => void refresh();
    profileRefreshListeners.add(onRefresh);
    if (!cachedAvatarSrc || !cachedNickname) void refresh();
    return () => {
      cancelled = true;
      profileRefreshListeners.delete(onRefresh);
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

  const openNotifications = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isDesktopNav()) {
      guardNav('/notifications')(event);
      return;
    }
    event.preventDefault();
    const open = () => {
      setMoreOpen(false);
      setNoticeOpen((open) => !open);
    };
    if (isWriteFlowPath(pathname)) {
      confirmLeaveWrite(open);
      return;
    }
    open();
  };

  const openCreateMenu = () => {
    setNoticeOpen(false);
    setMoreOpen(false);
    openModal({
      variant: 'action',
      items: [
        {
          label: '스토리 업',
          onClick: () => {
            storyFileInputRef.current?.click();
          },
        },
        {
          label: '게시글 작성',
          onClick: () => {
            writeFileInputRef.current?.click();
          },
        },
      ],
    });
  };

  const handleWriteFilesChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 9);
    event.target.value = '';
    if (files.length === 0) return;
    try {
      clearWriteDraft();
      const items = await Promise.all(
        files.map(async (file, i) => {
          const isVideo = file.type.startsWith('video/');
          const sourceUrl = isVideo ? URL.createObjectURL(file) : await readFileAsDataUrl(file);
          return {
            id: `media-${Date.now()}-${i}`,
            kind: (isVideo ? 'video' : 'image') as 'image' | 'video',
            fileName: file.name,
            mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
            sourceUrl,
          };
        }),
      );
      setWriteItems(items);
      router.push(`${myPath}/write/crop`);
    } catch (err) {
      console.error('[footer] write file', err);
    }
  };

  const handleStoryFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      clearStoryDraft();
      const isVideo = file.type.startsWith('video/');
      const sourceUrl = isVideo ? URL.createObjectURL(file) : await readFileAsDataUrl(file);
      setStoryMedia({
        sourceUrl,
        kind: isVideo ? 'video' : 'image',
        fileName: file.name,
      });
      router.push('/stories/up/crop');
    } catch (err) {
      console.error('[footer] story file', err);
    }
  };

  const toggleMore = () => {
    setNoticeOpen(false);
    setMoreOpen((open) => {
      if (open) return false;
      const rect = moreRef.current?.getBoundingClientRect();
      if (rect) {
        setMorePlace({
          left: 200,
          bottom: Math.max(12, window.innerHeight - rect.bottom),
        });
      }
      return true;
    });
  };

  const logout = async () => {
    setMoreOpen(false);
    try {
      await bffPostJson(bffEndpoints.auth.logout);
    } catch (err) {
      console.error('[footer] logout', err);
    }
    window.location.replace('/login');
  };

  return (
    <nav
      className={clsx(
        styles.footer,
        noticeOpen && styles.footerStill,
        moreOpen && styles.footerHold,
      )}
      aria-label="하단 메뉴"
    >
      <FooterNotice />
      <Link
        prefetch={false}
        href="/"
        className={styles.brand}
        aria-label="울타리"
        onClick={guardNav('/')}
      >
        <Fence className={styles.brandIcon} size={28} strokeWidth={1.75} />
        <Image src={LogoImage} alt="" width={140} height={42} className={styles.brandLogo} />
      </Link>

      <div className={styles.group}>
        <Link
          prefetch={false}
          href="/"
          className={clsx(styles.item, isHome && styles.itemCurrent)}
          aria-label="홈"
          aria-current={isHome ? 'page' : undefined}
          onClick={guardNav('/')}
        >
          <Image
            src={isHome ? HomeFillIcon : HomeIcon}
            alt=""
            width={33}
            height={33}
            className={styles.homeIcon}
          />
          <span className={styles.label}>홈</span>
        </Link>

        <Link
          prefetch={false}
          href="/search"
          className={clsx(styles.item, isSearch && styles.itemCurrent)}
          aria-label="검색"
          aria-current={isSearch ? 'page' : undefined}
          onClick={guardNav('/search')}
        >
          <Image src={isSearch ? SearchFillIcon : SearchIcon} alt="" width={30} height={30} />
          <span className={styles.label}>검색</span>
        </Link>

        <Link
          prefetch={false}
          href="/notifications"
          className={clsx(styles.item, (isNotifications || noticeOpen) && styles.itemCurrent)}
          aria-label={
            unreadCount != null && unreadCount > 0
              ? `알림 ${unreadBadgeLabel(unreadCount)}`
              : '알림'
          }
          aria-current={isNotifications ? 'page' : undefined}
          aria-expanded={noticeOpen}
          onClick={openNotifications}
        >
          <span className={styles.iconWrap}>
            <Image
              src={isNotifications || noticeOpen ? BellFillIcon : BellIcon}
              alt=""
              width={30}
              height={30}
            />
            {unreadCount != null && unreadCount > 0 ? (
              <span className={styles.badge} aria-hidden>
                {unreadBadgeLabel(unreadCount)}
              </span>
            ) : null}
          </span>
          <span className={styles.label}>알림</span>
        </Link>

        <Link
          prefetch={false}
          href="/dm"
          className={clsx(styles.item, isDm && styles.itemCurrent)}
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
          <span className={styles.label}>메시지</span>
        </Link>

        <button type="button" className={styles.plus} aria-label="만들기" onClick={openCreateMenu}>
          <Image src={AddIcon} alt="" width={28} height={28} />
          <span className={styles.label}>만들기</span>
        </button>

        <Link
          prefetch={false}
          href={myPath}
          className={clsx(styles.item, isMyUltary && styles.itemCurrent)}
          aria-label="울타리"
          aria-current={isMyUltary ? 'page' : undefined}
          onClick={guardNav(myPath)}
        >
          <MediaImage
            src={avatarSrc}
            alt=""
            width={35}
            height={35}
            className={clsx(styles.myUltaryAvatar, isMyUltary && styles.myUltaryAvatarActive)}
          />
          <span className={styles.label}>울타리</span>
        </Link>
      </div>

      <button
        ref={moreRef}
        type="button"
        className={clsx(styles.moreBtn, moreOpen && styles.itemCurrent)}
        aria-label="더보기"
        aria-expanded={moreOpen}
        onClick={toggleMore}
      >
        <Menu className={styles.moreIcon} size={28} strokeWidth={1.75} />
        <span className={styles.label}>더보기</span>
      </button>

      {moreOpen && morePlace ? (
        <>
          <button
            type="button"
            className={styles.moreDim}
            aria-label="더보기 닫기"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className={styles.moreMenu}
            style={{ left: morePlace.left, bottom: morePlace.bottom }}
          >
            <Link
              prefetch={false}
              href="/settings"
              className={styles.moreItem}
              onClick={guardNav('/settings')}
            >
              <Settings size={22} strokeWidth={1.75} />
              설정
            </Link>
            <Link
              prefetch={false}
              href="/settings/activity"
              className={styles.moreItem}
              onClick={guardNav('/settings/activity')}
            >
              <List size={22} strokeWidth={1.75} />내 활동
            </Link>
            <Link
              prefetch={false}
              href="/settings/saved"
              className={styles.moreItem}
              onClick={guardNav('/settings/saved')}
            >
              <Bookmark size={22} strokeWidth={1.75} />
              저장됨
            </Link>
            <button
              type="button"
              className={clsx(styles.moreItem, styles.moreLogout)}
              onClick={() => void logout()}
            >
              <LogOut size={22} strokeWidth={1.75} />
              로그아웃
            </button>
          </div>
        </>
      ) : null}

      <PcNotificationDrawer open={noticeOpen} onClose={() => setNoticeOpen(false)} />

      <input
        ref={writeFileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className={styles.fileInput}
        onChange={(event) => void handleWriteFilesChange(event)}
      />
      <input
        ref={storyFileInputRef}
        type="file"
        accept="image/*,video/*"
        className={styles.fileInput}
        onChange={(event) => void handleStoryFileChange(event)}
      />
    </nav>
  );
}
