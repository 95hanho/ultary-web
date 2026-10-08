'use client';

import { MediaImage } from '@/components/common/MediaImage';
import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import { bffDelete, bffPostJson } from '@/lib/api/bffFetch';
import { loadMyUserNo } from '@/lib/auth/myUserNo';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { resolveFeedPetLabels, type FeedPetLabel } from '@/lib/feed/petLabels';
import { splitCaptionTags, type TagExplain } from '@/lib/mock/tags';
import { loadTagExplain } from '@/lib/tag/explain';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { showFooterNotice } from '@/lib/ui/footerNotice';
import { openReportModal, cancelReport, canCancelReport, type MyReport } from '@/lib/report/openReport';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { Bookmark, Ellipsis, Flag, Trash2, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { CommentSheet } from './CommentSheet';
import styles from './Feed.module.scss';
import { TagExplainPopover, type TagExplainMode } from './TagExplainPopover';

/** 피드 액션 아이콘 (public) */
const FavoriteIcon = '/images/icon/Favorite.svg';
const FavoriteFillIcon = '/images/icon/Favorite_fill.svg';
const CommentIcon = '/images/icon/comment.svg';
const ShareIcon = '/images/icon/share.svg';
const PinIcon = '/images/icon/Pin.svg';
const PinFillIcon = '/images/icon/Pin_fill.svg';
const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const ArrowRightIcon = '/images/icon/arrow_right.svg';

function readFlag(raw: unknown, key: 'pinnedByMe' | 'savedByMe'): boolean | null {
  const root = isRecord(raw) && isRecord(raw.data) ? raw.data : raw;
  if (!isRecord(root)) return null;
  return typeof root[key] === 'boolean' ? root[key] : null;
}

function readLikeState(raw: unknown): { liked: boolean; count: number } | null {
  const root = isRecord(raw) && isRecord(raw.data) ? raw.data : raw;
  if (!isRecord(root)) return null;
  if (typeof root.likedByMe !== 'boolean' || typeof root.likeCount !== 'number') return null;
  return { liked: root.likedByMe, count: root.likeCount };
}

export type FeedData = {
  id: string;
  /** 작성자. 스토리 링·스토리 이동에 사용 */
  userNo?: number;
  nickname: string;
  profileUrl: string;
  /** 캐러셀용. 목업은 같은 사진 여러 장도 OK */
  images: string[];
  /** images와 같은 순서의 feedMediaId. 없으면 공유 시 첫 장 */
  mediaIds?: Array<number | null>;
  /** images와 같은 순서. 사진 위 펫 태그 위치 (0~1) */
  photoTags?: FeedPhotoTag[][];
  caption: string;
  /** 이 글에 연결된 태그. 캡션 해시태그 설명에서 같은 글을 우선한다 */
  tagIds?: number[];
  /** 스토리 링 상태 */
  story?: StoryStatus;
  /** 좋아요 여부 */
  isFavorite?: boolean;
  /** 울타리 고정 여부 */
  isPinned?: boolean;
  /** 나만 보는 저장 여부 */
  isSaved?: boolean;
  likeCount?: number;
  commentCount?: number;
  /** 내가 이 글을 신고한 상태. 없으면 null */
  myReport?: MyReport | null;
};

export type FeedPhotoTag = {
  petId: number;
  /** 사진 기준 0~1 */
  x: number;
  y: number;
  /** 멘션 응답에 보호자 닉네임이 있으면 그 울타리로 이동 */
  ownerNickname?: string;
  /** 보호자. 펫 목록으로 닉네임을 찾을 때 사용 */
  userNo?: number;
  mentionId?: string;
  petName?: string;
};

function tagOwnerHref(tag: FeedPhotoTag, labels: Record<number, FeedPetLabel>) {
  const nick = labels[tag.petId]?.ownerNickname?.trim() || tag.ownerNickname?.trim();
  return nick ? myUltaryPath(nick) : null;
}

type FeedProps = FeedData & {
  /** 마이울타리 게시글 목록에서는 작성자 사진·닉네임을 숨긴다 */
  showAuthor?: boolean;
  /** 캐러셀 시작 위치. 0이 첫 장 */
  initialMediaIndex?: number;
};

/** 메인 피드 게시글 카드 */
export function Feed({
  id,
  userNo,
  nickname,
  profileUrl,
  images,
  mediaIds,
  photoTags,
  caption,
  tagIds = [],
  story = 'none',
  isFavorite = false,
  isPinned = false,
  isSaved = false,
  likeCount = 0,
  commentCount = 0,
  myReport: myReportFromServer = null,
  showAuthor = true,
  initialMediaIndex = 0,
}: FeedProps) {
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);
  const slideCount = Math.max(images.length, 1);
  const startIndex = Math.min(Math.max(0, Math.floor(initialMediaIndex) || 0), slideCount - 1);
  const [index, setIndex] = useState(startIndex);
  const [expanded, setExpanded] = useState(false);
  const [needsMore, setNeedsMore] = useState(false);
  const [liked, setLiked] = useState(isFavorite);
  const [likes, setLikes] = useState(likeCount);
  const [comments, setComments] = useState(commentCount);
  const [likePending, setLikePending] = useState(false);
  const [pinned, setPinned] = useState(isPinned);
  const [pinPending, setPinPending] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [savePending, setSavePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [myReport, setMyReport] = useState<MyReport | null>(myReportFromServer);
  const [removed, setRemoved] = useState(false);
  const [myUserNo, setMyUserNo] = useState<number | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePlace, setMorePlace] = useState<{ top: number; left: number } | null>(null);
  const moreWrapRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const photoFrameRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const leaveTimerRef = useRef<number | null>(null);
  /** PC: 태그 호버 0.5초 후 프리뷰 */
  const hoverOpenTimerRef = useRef<number | null>(null);
  /** 프리뷰 오픈 직후 가짜 leave로 바로 닫히지 않게 */
  const ignoreLeaveUntilRef = useRef(0);
  /** 터치 탭 후 합성 mouseenter로 프리뷰가 열리는 것 방지 */
  const lastPointerTypeRef = useRef<string>('mouse');

  const [tagOpen, setTagOpen] = useState<{
    data: TagExplain;
    rect: DOMRect;
    mode: TagExplainMode;
    closeRequested?: boolean;
  } | null>(null);
  const tagOpenRef = useRef(tagOpen);
  tagOpenRef.current = tagOpen;
  const tagReqRef = useRef(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagListOpen, setTagListOpen] = useState(false);
  const [petLabels, setPetLabels] = useState<Record<number, FeedPetLabel>>({});

  useEffect(() => {
    setLiked(isFavorite);
    setLikes(likeCount);
  }, [id, isFavorite, likeCount]);

  useEffect(() => {
    setComments(commentCount);
  }, [id, commentCount]);

  useEffect(() => {
    setPinned(isPinned);
  }, [id, isPinned]);

  useEffect(() => {
    setSaved(isSaved);
  }, [id, isSaved]);

  useEffect(() => {
    setMyReport(myReportFromServer);
  }, [id, myReportFromServer]);

  useEffect(() => {
    let cancelled = false;
    void loadMyUserNo().then((userNo) => {
      if (!cancelled) setMyUserNo(userNo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isMine = myUserNo != null && userNo === myUserNo;
  const canReport = myUserNo != null && userNo != null && userNo !== myUserNo;

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('comments') === id) {
        setCommentsOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [id]);

  useEffect(() => {
    setTagsOpen(false);
    setTagListOpen(false);
  }, [id, index]);

  useEffect(() => {
    const ids = [...new Set((photoTags ?? []).flat().map((tag) => tag.petId))];
    if (ids.length === 0) return;
    let cancelled = false;
    resolveFeedPetLabels(ids, userNo, nickname, (photoTags ?? []).flat()).then((found) => {
      if (!cancelled) setPetLabels(found);
    });
    return () => {
      cancelled = true;
    };
  }, [id, nickname, photoTags, userNo]);

  useLayoutEffect(() => {
    if (!moreOpen) return;
    const anchor = moreWrapRef.current;
    const menu = moreMenuRef.current;
    if (!anchor || !menu) return;

    const place = () => {
      const buttonEl = anchor.querySelector('button');
      const button = (buttonEl ?? anchor).getBoundingClientRect();
      const box = menu.getBoundingClientRect();
      const pad = 8;
      const gap = 6;
      const width = box.width;
      const height = box.height;
      const limitRight = window.innerWidth - pad;
      const limitBottom = window.innerHeight - pad;
      if (button.bottom < pad || button.top > limitBottom) {
        setMoreOpen(false);
        return;
      }

      const obstacles = [
        document.querySelector('nav[aria-label="하단 메뉴"]'),
        document.querySelector('[data-dev-test-dock]'),
      ].flatMap((el) => {
        if (!(el instanceof HTMLElement)) return [];
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return [];
        return [rect];
      });

      const blocked = (top: number, left: number) => {
        const right = left + width;
        const bottom = top + height;
        if (left < pad || top < pad || right > limitRight || bottom > limitBottom) return true;
        return obstacles.some(
          (obstacle) =>
            left < obstacle.right &&
            right > obstacle.left &&
            top < obstacle.bottom &&
            bottom > obstacle.top,
        );
      };

      const preferredLeft =
        button.right + width <= limitRight ? button.right : Math.max(pad, button.right - width);
      const below = button.bottom + gap;
      const above = button.top - height - gap;
      const candidates = [
        { top: below, left: preferredLeft },
        { top: above, left: preferredLeft },
      ];
      for (const obstacle of obstacles) {
        const overTop = obstacle.top - height - gap;
        if (overTop >= pad) candidates.push({ top: overTop, left: preferredLeft });
        const shifted = obstacle.left - width - gap;
        if (shifted >= pad) {
          candidates.push({ top: below, left: shifted });
          candidates.push({ top: above, left: shifted });
        }
      }

      const chosen = candidates.find((spot) => !blocked(spot.top, spot.left)) ?? {
        top: Math.max(pad, Math.min(above, limitBottom - height)),
        left: preferredLeft,
      };
      setMorePlace(chosen);
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const wrap = moreWrapRef.current;
      const target = event.target;
      if (wrap && target instanceof Node && wrap.contains(target)) return;
      setMoreOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!tagListOpen && !tagsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const frame = photoFrameRef.current;
      const target = event.target;
      if (frame && target instanceof Node && frame.contains(target)) return;
      setTagListOpen(false);
      setTagsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [tagListOpen, tagsOpen]);

  const toggleLike = useCallback(async () => {
    if (likePending) return;
    const next = !liked;
    setLiked(next);
    setLikes((count) => (next ? count + 1 : Math.max(0, count - 1)));
    setLikePending(true);
    try {
      const res = next
        ? await bffPostJson<unknown>(bffEndpoints.feeds.like, { feedId: id })
        : await bffDelete<unknown>(bffEndpoints.feeds.like, { feedId: id });
      const saved = readLikeState(res);
      if (saved) {
        setLiked(saved.liked);
        setLikes(saved.count);
      }
    } catch (err) {
      console.error('[feed] like failed', err);
      setLiked(!next);
      setLikes((count) => (next ? Math.max(0, count - 1) : count + 1));
    } finally {
      setLikePending(false);
    }
  }, [id, likePending, liked]);

  const togglePin = useCallback(async () => {
    if (pinPending) return;
    const next = !pinned;
    setPinned(next);
    setPinPending(true);
    try {
      const res = next
        ? await bffPostJson<unknown>(bffEndpoints.feeds.pin, { feedId: id })
        : await bffDelete<unknown>(bffEndpoints.feeds.pin, { feedId: id });
      const flag = readFlag(res, 'pinnedByMe');
      const applied = flag ?? next;
      if (flag != null) setPinned(flag);
      showFooterNotice(
        applied ? '울타리 고정이 완료되었습니다.' : '울타리 고정이 취소되었습니다.',
      );
    } catch (err) {
      console.error('[feed] pin failed', err);
      setPinned(!next);
    } finally {
      setPinPending(false);
    }
  }, [id, pinPending, pinned]);

  const toggleSave = useCallback(async () => {
    if (savePending) return;
    const next = !saved;
    setSaved(next);
    setSavePending(true);
    try {
      const res = next
        ? await bffPostJson<unknown>(bffEndpoints.feeds.save, { feedId: id })
        : await bffDelete<unknown>(bffEndpoints.feeds.save, { feedId: id });
      const flag = readFlag(res, 'savedByMe');
      const applied = flag ?? next;
      if (flag != null) setSaved(flag);
      showFooterNotice(
        applied ? '게시글 저장이 완료되었습니다.' : '게시글 저장이 취소되었습니다.',
      );
    } catch (err) {
      console.error('[feed] save failed', err);
      setSaved(!next);
    } finally {
      setSavePending(false);
    }
  }, [id, savePending, saved]);

  const askDelete = useCallback(() => {
    if (deletePending) return;
    setMoreOpen(false);
    openModal({
      variant: 'confirm',
      title: '알림창',
      content: '이 게시글을 삭제할까요?',
      showCloseButton: true,
      okButton: {
        label: '삭제',
        tone: 'danger',
        onClick: () => {
          void (async () => {
            setDeletePending(true);
            try {
              await bffDelete<unknown>(bffEndpoints.feeds.detail, { feedId: id });
              setRemoved(true);
            } catch (err) {
              console.error('[feed] delete failed', err);
              openModal({
                variant: 'alert',
                title: '알림창',
                content: '게시글을 삭제하지 못했습니다.',
                showCloseButton: true,
              });
            } finally {
              setDeletePending(false);
            }
          })();
        },
      },
    });
  }, [deletePending, id, openModal]);

  const askReport = useCallback(() => {
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) return;
    setMoreOpen(false);
    if (canCancelReport(myReport)) {
      void cancelReport(myReport.reportId)
        .then(() => setMyReport(null))
        .catch(() => undefined);
      return;
    }
    openReportModal({ targetType: 'FEED', targetId }, setMyReport);
  }, [id, myReport]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      lastPointerTypeRef.current = e.pointerType || 'mouse';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') lastPointerTypeRef.current = 'mouse';
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('pointermove', onPointerMove, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
    };
  }, []);

  const safeImages = images.length > 0 ? images : ['/images/mock/post.jpg'];
  const slideTags = photoTags ?? [];
  const currentTags = slideTags[index] ?? [];
  const hasMultiple = safeImages.length > 1;
  const showPrev = hasMultiple && index > 0;
  const showNext = hasMultiple && index < safeImages.length - 1;
  const captionParts = splitCaptionTags(caption);
  const storyRing = story === 'unread' ? 'unread' : 'none';
  const storyHref =
    storyRing === 'unread' && userNo != null
      ? `/stories?${new URLSearchParams({
          userNo: String(userNo),
          nickname,
          single: '1',
        }).toString()}`
      : null;

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current != null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const clearHoverOpenTimer = () => {
    if (hoverOpenTimerRef.current != null) {
      window.clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }
  };

  const closeTag = useCallback(() => {
    clearLeaveTimer();
    clearHoverOpenTimer();
    setTagOpen(null);
  }, []);

  const requestTagExplain = (tagText: string, el: HTMLElement, mode: 'active' | 'preview') => {
    const key = tagText.replace(/^#/, '').trim();
    if (!key) return;
    const rect = el.getBoundingClientRect();
    const token = ++tagReqRef.current;
    const placeholder: TagExplain = {
      tag: key,
      title: key,
      description: '불러오는 중…',
    };

    if (mode === 'active') {
      clearLeaveTimer();
      clearHoverOpenTimer();
      setTagOpen({ data: placeholder, rect, mode });
    } else {
      clearLeaveTimer();
      setTagOpen((prev) => {
        if (prev && !prev.closeRequested) return prev;
        ignoreLeaveUntilRef.current = Date.now() + 320;
        return { data: placeholder, rect, mode: 'preview' };
      });
    }

    void loadTagExplain(key, tagIds).then((data) => {
      if (tagReqRef.current !== token) return;
      setTagOpen((prev) => {
        if (!prev || prev.data.tag !== key) return prev;
        return { ...prev, data };
      });
    });
  };

  /** 클릭 등으로 모달 100% 오픈 */
  const openTagActive = (tagText: string, el: HTMLElement) => {
    requestTagExplain(tagText, el, 'active');
  };

  /**
   * 호버 프리뷰 — 모달이 완전히 꺼져 있을 때만.
   * 이미 preview/active면 건드리지 않음 (active→흐림 금지).
   */
  const openTagPreviewIfClosed = (tagText: string, el: HTMLElement) => {
    if (tagOpenRef.current && !tagOpenRef.current.closeRequested) return;
    requestTagExplain(tagText, el, 'preview');
  };

  /** PC: 태그 위에 0.5초 머무르면 흐릿한 프리뷰 */
  const scheduleHoverPreview = (tagText: string, el: HTMLElement) => {
    clearLeaveTimer();
    clearHoverOpenTimer();
    const open = tagOpenRef.current;
    if (open && !open.closeRequested) return;
    hoverOpenTimerRef.current = window.setTimeout(() => {
      hoverOpenTimerRef.current = null;
      openTagPreviewIfClosed(tagText, el);
    }, 500);
  };

  /** 프리뷰만 leave로 닫음. active(클릭 선명)는 X/바깥 클릭으로만 닫음 */
  const scheduleCloseIfPreview = () => {
    if (Date.now() < ignoreLeaveUntilRef.current) return;
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      setTagOpen((prev) => {
        if (!prev || prev.mode === 'active') return prev;
        return { ...prev, closeRequested: true };
      });
    }, 220);
  };

  useLayoutEffect(() => {
    const el = captionRef.current;
    if (!el) return;

    if (expanded) {
      return;
    }

    const measure = () => {
      setNeedsMore(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [caption, nickname, expanded]);

  if (removed) return null;

  return (
    <article id={`feed-${id}`} className={styles.feed}>
      {showAuthor ? (
        <header className={styles.header}>
          {storyHref ? (
            <Link href={storyHref} className={styles.profileLink} aria-label={`${nickname} 스토리`}>
              <Profile imageUrl={profileUrl} size={36} story={storyRing} />
            </Link>
          ) : (
            <Profile imageUrl={profileUrl} size={36} story={storyRing} />
          )}
          <Link href={myUltaryPath(nickname)} className={styles.nickname}>
            {nickname}
          </Link>
        </header>
      ) : null}
      <div className={styles.content}>
        <div className={styles.media}>
          <Swiper
            slidesPerView={1}
            spaceBetween={0}
            initialSlide={startIndex}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
            className={styles.swiper}
          >
            {safeImages.map((src, i) => {
              const tags = slideTags[i] ?? [];
              return (
                <SwiperSlide key={`${src}-${i}`}>
                  <div
                    ref={i === index ? photoFrameRef : undefined}
                    className={styles.photoFrame}
                    onClick={() => {
                      if (tags.length === 0) return;
                      if (tagListOpen || tagsOpen) {
                        setTagListOpen(false);
                        setTagsOpen(false);
                        return;
                      }
                      setTagsOpen(true);
                    }}
                  >
                    <MediaImage
                      src={src}
                      alt=""
                      width={430}
                      height={430}
                      className={styles.photo}
                      style={{ height: 'auto' }}
                    />
                    {tagsOpen && i === index
                      ? tags.map((tag) => {
                          const href = tagOwnerHref(tag, petLabels);
                          const label = petLabels[tag.petId]?.label ?? '태그';
                          const style = { left: `${tag.x * 100}%`, top: `${tag.y * 100}%` };
                          if (!href) {
                            return (
                              <span key={tag.petId} className={styles.petTag} style={style}>
                                {label}
                              </span>
                            );
                          }
                          return (
                            <Link
                              key={tag.petId}
                              href={href}
                              className={clsx(styles.petTag, styles.petTagLink)}
                              style={style}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {label}
                            </Link>
                          );
                        })
                      : null}
                    {tags.length > 0 ? (
                      <button
                        type="button"
                        className={styles.tagPeopleBtn}
                        aria-label="태그된 펫"
                        aria-expanded={tagListOpen && i === index}
                        onClick={(event) => {
                          event.stopPropagation();
                          setTagsOpen(false);
                          setTagListOpen((open) => !open);
                        }}
                      >
                        <User size={16} strokeWidth={2.25} aria-hidden />
                      </button>
                    ) : null}
                    {tagListOpen && i === index ? (
                      <ul className={styles.tagList}>
                        {tags.map((tag) => {
                          const info = petLabels[tag.petId];
                          const href = tagOwnerHref(tag, petLabels);
                          const body = (
                            <>
                              <MediaImage
                                src={info?.imageUrl ?? NO_PROFILE_SRC}
                                alt=""
                                width={28}
                                height={28}
                                className={styles.tagListAvatar}
                              />
                              <span>{info?.label ?? '태그된 펫'}</span>
                            </>
                          );
                          return (
                            <li key={tag.petId} className={styles.tagListItem}>
                              {href ? (
                                <Link
                                  href={href}
                                  className={styles.tagListLink}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {body}
                                </Link>
                              ) : (
                                body
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
          {showPrev ? (
            <button
              type="button"
              className={clsx(styles.navBtn, styles.navPrev)}
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="이전 사진"
            >
              <Image src={ArrowLeftIcon} alt="" width={16} height={16} />
            </button>
          ) : null}
          {showNext ? (
            <button
              type="button"
              className={clsx(styles.navBtn, styles.navNext)}
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="다음 사진"
            >
              <Image src={ArrowRightIcon} alt="" width={16} height={16} />
            </button>
          ) : null}
          {hasMultiple ? (
            <div className={styles.dots} aria-hidden>
              {safeImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={clsx(styles.dot, i === index && styles.dotActive)}
                  onClick={() => {
                    setIndex(i);
                    swiperRef.current?.slideTo(i);
                  }}
                  aria-label={`${i + 1}번째 사진`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.actions}>
          <div className={styles.actionsLeft}>
            <button
              type="button"
              className={styles.actionBtn}
              aria-label={`좋아요 ${likes}`}
              aria-pressed={liked}
              disabled={likePending}
              onClick={() => {
                void toggleLike();
              }}
            >
              <Image src={liked ? FavoriteFillIcon : FavoriteIcon} alt="" width={25} height={25} />
              <span className={clsx(styles.actionCount, liked && styles.actionCountOn)}>
                {likes}
              </span>
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              aria-label={`댓글 ${comments}`}
              onClick={() => setCommentsOpen(true)}
            >
              <Image src={CommentIcon} alt="" width={31} height={31} />
              <span className={styles.actionCount}>{comments}</span>
            </button>
            <button
              type="button"
              className={styles.actionBtn}
              aria-label="공유"
              onClick={() => {
                openModal({
                  variant: 'action',
                  title: '공유',
                  items: [
                    {
                      label: '링크 복사',
                      onClick: () => {
                        const url = `${window.location.origin}/posts/${id}`;
                        void navigator.clipboard?.writeText(url).catch(() => {
                          /* ignore */
                        });
                      },
                    },
                    {
                      label: '메시지로 보내기',
                      onClick: () => {
                        const params = new URLSearchParams({ feedId: id });
                        const mediaId = mediaIds?.[index];
                        if (mediaId != null) params.set('feedMediaId', String(mediaId));
                        router.push(`/dm?${params.toString()}`);
                      },
                    },
                  ],
                });
              }}
            >
              <Image src={ShareIcon} alt="" width={27} height={10} />
            </button>
          </div>
          <div className={styles.moreWrap} ref={moreWrapRef}>
            <button
              type="button"
              className={styles.actionBtn}
              aria-label="더보기"
              aria-expanded={moreOpen}
              onClick={() => {
                setMorePlace(null);
                setMoreOpen((open) => !open);
              }}
            >
              <Ellipsis size={25} strokeWidth={2} />
            </button>
            {moreOpen ? (
              <div
                ref={moreMenuRef}
                className={styles.moreMenu}
                role="menu"
                style={
                  morePlace
                    ? { top: morePlace.top, left: morePlace.left }
                    : { visibility: 'hidden' }
                }
              >
                <button
                  type="button"
                  className={styles.moreItem}
                  role="menuitem"
                  disabled={pinPending}
                  onClick={() => {
                    setMoreOpen(false);
                    void togglePin();
                  }}
                >
                  <span className={styles.moreIcon}>
                    <Image src={pinned ? PinFillIcon : PinIcon} alt="" width={22} height={22} />
                  </span>
                  <span className={styles.moreLabel}>울타리 고정</span>
                </button>
                <button
                  type="button"
                  className={styles.moreItem}
                  role="menuitem"
                  disabled={savePending}
                  onClick={() => {
                    setMoreOpen(false);
                    void toggleSave();
                  }}
                >
                  <span className={styles.moreIcon}>
                    <Bookmark size={22} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
                  </span>
                  <span className={styles.moreLabel}>게시글 저장</span>
                </button>
                {isMine ? (
                  <button
                    type="button"
                    className={styles.moreItem}
                    role="menuitem"
                    disabled={deletePending}
                    onClick={askDelete}
                  >
                    <span className={styles.moreIcon}>
                      <Trash2 size={22} strokeWidth={1.75} />
                    </span>
                    <span className={styles.moreLabel}>삭제</span>
                  </button>
                ) : null}
                {canReport ? (
                  <button
                    type="button"
                    className={styles.moreItem}
                    role="menuitem"
                    onClick={askReport}
                  >
                    <span className={styles.moreIcon}>
                      <Flag size={22} strokeWidth={1.75} />
                    </span>
                    <span className={styles.moreLabel}>
                      {canCancelReport(myReport) ? '신고취소' : '신고하기'}
                    </span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.captionWrap}>
          <p ref={captionRef} className={clsx(styles.caption, !expanded && styles.captionClamped)}>
            {showAuthor ? <strong className={styles.captionNick}>{nickname}</strong> : null}
            {showAuthor ? ' ' : null}
            {captionParts.map((part, i) => {
              if (part.type !== 'tag') {
                return <span key={`t-${i}`}>{part.value}</span>;
              }
              return (
                <button
                  key={`tag-${i}-${part.value}`}
                  type="button"
                  data-tag-trigger="true"
                  className={styles.captionTag}
                  onMouseDown={(e) => {
                    // 버튼 포커스 스크롤이 모달 scroll-close를 유발하지 않게
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openTagActive(part.value, e.currentTarget);
                  }}
                  onMouseEnter={(e) => {
                    // 터치 기기의 sticky hover / 합성 mouseenter 무시
                    if (lastPointerTypeRef.current !== 'mouse') return;
                    scheduleHoverPreview(part.value, e.currentTarget);
                  }}
                  onMouseLeave={() => {
                    if (lastPointerTypeRef.current !== 'mouse') return;
                    clearHoverOpenTimer();
                    scheduleCloseIfPreview();
                  }}
                >
                  {part.value}
                </button>
              );
            })}
          </p>
          {!expanded && needsMore ? (
            <span className={styles.moreFade}>
              <button type="button" className={styles.moreBtn} onClick={() => setExpanded(true)}>
                ...더보기
              </button>
            </span>
          ) : null}
        </div>
      </div>

      {tagOpen ? (
        <TagExplainPopover
          key={tagOpen.data.tag}
          data={tagOpen.data}
          anchorRect={tagOpen.rect}
          mode={tagOpen.mode}
          closeRequested={tagOpen.closeRequested}
          onModeChange={(next) =>
            setTagOpen((prev) => (prev ? { ...prev, mode: next, closeRequested: false } : prev))
          }
          onClose={closeTag}
          onPopoverEnter={clearLeaveTimer}
          onPopoverLeave={() => {
            // active(클릭으로 연 상태)는 태그/모달 leave로 닫지 않음
            scheduleCloseIfPreview();
          }}
        />
      ) : null}

      <CommentSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        feedId={id}
        onCommentCreated={() => setComments((count) => count + 1)}
        onCommentDeleted={() => setComments((count) => Math.max(0, count - 1))}
      />
    </article>
  );
}
