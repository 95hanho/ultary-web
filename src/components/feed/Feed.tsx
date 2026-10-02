'use client';

import { MediaImage } from '@/components/common/MediaImage';
import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import { bffDelete, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { resolveFeedPetLabels, type FeedPetLabel } from '@/lib/feed/petLabels';
import { getTagExplain, splitCaptionTags, type TagExplain } from '@/lib/mock/tags';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { User } from 'lucide-react';
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

function readStoredFlag(raw: unknown): boolean | null {
  const root = isRecord(raw) && isRecord(raw.data) ? raw.data : raw;
  if (!isRecord(root)) return null;
  if (typeof root.storedByMe === 'boolean') return root.storedByMe;
  if (typeof root.stored === 'boolean') return root.stored;
  return null;
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
  /** 스토리 링 상태 */
  story?: StoryStatus;
  /** 좋아요 여부 */
  isFavorite?: boolean;
  /** 저장 여부 */
  isStored?: boolean;
  likeCount?: number;
  commentCount?: number;
};

export type FeedPhotoTag = {
  petId: number;
  /** 사진 기준 0~1 */
  x: number;
  y: number;
};

type FeedProps = FeedData & {
  /** 마이울타리 게시글 목록에서는 작성자 사진·닉네임을 숨긴다 */
  showAuthor?: boolean;
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
  story = 'none',
  isFavorite = false,
  isStored = false,
  likeCount = 0,
  commentCount = 0,
  showAuthor = true,
}: FeedProps) {
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [needsMore, setNeedsMore] = useState(false);
  const [liked, setLiked] = useState(isFavorite);
  const [likes, setLikes] = useState(likeCount);
  const [stored, setStored] = useState(isStored);
  const [storePending, setStorePending] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);
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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagListOpen, setTagListOpen] = useState(false);
  const [petLabels, setPetLabels] = useState<Record<number, FeedPetLabel>>({});

  useEffect(() => {
    setStored(isStored);
  }, [id, isStored]);

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
    resolveFeedPetLabels(ids, userNo).then((found) => {
      if (!cancelled) setPetLabels(found);
    });
    return () => {
      cancelled = true;
    };
  }, [id, photoTags, userNo]);

  const toggleStore = useCallback(async () => {
    if (storePending) return;
    const next = !stored;
    setStored(next);
    setStorePending(true);
    try {
      const res = next
        ? await bffPostJson<unknown>(bffEndpoints.feeds.store, { feedId: id })
        : await bffDelete<unknown>(bffEndpoints.feeds.store, { feedId: id });
      const saved = readStoredFlag(res);
      if (saved != null) setStored(saved);
    } catch (err) {
      console.error('[feed] store failed', err);
      setStored(!next);
    } finally {
      setStorePending(false);
    }
  }, [id, storePending, stored]);

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

  /** 클릭 등으로 모달 100% 오픈 */
  const openTagActive = (tagText: string, el: HTMLElement) => {
    const data = getTagExplain(tagText);
    if (!data) return;
    clearLeaveTimer();
    clearHoverOpenTimer();
    setTagOpen({
      data,
      rect: el.getBoundingClientRect(),
      mode: 'active',
    });
  };

  /**
   * 호버 프리뷰 — 모달이 완전히 꺼져 있을 때만.
   * 이미 preview/active면 건드리지 않음 (active→흐림 금지).
   */
  const openTagPreviewIfClosed = (tagText: string, el: HTMLElement) => {
    const data = getTagExplain(tagText);
    if (!data) return;
    clearLeaveTimer();
    setTagOpen((prev) => {
      if (prev && !prev.closeRequested) return prev;
      ignoreLeaveUntilRef.current = Date.now() + 320;
      return {
        data,
        rect: el.getBoundingClientRect(),
        mode: 'preview',
      };
    });
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
                    className={styles.photoFrame}
                    onClick={() => {
                      if (tags.length === 0) return;
                      setTagListOpen(false);
                      setTagsOpen((open) => !open);
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
                      ? tags.map((tag) => (
                          <span
                            key={tag.petId}
                            className={styles.petTag}
                            style={{ left: `${tag.x * 100}%`, top: `${tag.y * 100}%` }}
                          >
                            {petLabels[tag.petId]?.label ?? '태그'}
                          </span>
                        ))
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
                      <ul className={styles.tagList} onClick={(event) => event.stopPropagation()}>
                        {tags.map((tag) => {
                          const info = petLabels[tag.petId];
                          return (
                            <li key={tag.petId} className={styles.tagListItem}>
                              <MediaImage
                                src={info?.imageUrl ?? NO_PROFILE_SRC}
                                alt=""
                                width={28}
                                height={28}
                                className={styles.tagListAvatar}
                              />
                              <span>{info?.label ?? '태그된 펫'}</span>
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
              onClick={() => {
                setLiked((v) => {
                  setLikes((c) => (v ? Math.max(0, c - 1) : c + 1));
                  return !v;
                });
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
              aria-label={`댓글 ${commentCount}`}
              onClick={() => setCommentsOpen(true)}
            >
              <Image src={CommentIcon} alt="" width={31} height={31} />
              <span className={styles.actionCount}>{commentCount}</span>
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
                        const url = `${window.location.origin}/myultary/${nickname}/posts/${id}`;
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
              <Image src={ShareIcon} alt="" width={23} height={23} />
            </button>
          </div>
          <button
            type="button"
            className={styles.actionBtn}
            aria-label="저장"
            aria-pressed={stored}
            disabled={storePending}
            onClick={() => {
              void toggleStore();
            }}
          >
            <Image src={stored ? PinFillIcon : PinIcon} alt="" width={25} height={25} />
          </button>
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

      <CommentSheet open={commentsOpen} onClose={() => setCommentsOpen(false)} feedId={id} />
    </article>
  );
}
