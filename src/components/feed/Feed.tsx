'use client';

import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import { getTagExplain, splitCaptionTags, type TagExplain } from '@/lib/mock/tags';
import clsx from 'clsx';
import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './Feed.module.scss';
import { TagExplainPopover, type TagExplainMode } from './TagExplainPopover';

/** 피드 액션 아이콘 (public) */
const FavoriteIcon = '/images/icon/Favorite.svg';
const FavoriteFillIcon = '/images/icon/Favorite_fill.svg'; // 좋아요 ON — 연결 전
const CommentIcon = '/images/icon/comment.svg';
const ShareIcon = '/images/icon/share.svg';
const PinIcon = '/images/icon/Pin.svg';
const PinFillIcon = '/images/icon/Pin_fill.svg';
const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const ArrowRightIcon = '/images/icon/arrow_right.svg';

export type FeedData = {
  id: string;
  nickname: string;
  profileUrl: string;
  /** 캐러셀용. 목업은 같은 사진 여러 장도 OK */
  images: string[];
  caption: string;
  /** 스토리 링 상태 */
  story?: StoryStatus;
  /** 좋아요 여부 */
  isFavorite?: boolean;
  /** 저장 여부 */
  isStored?: boolean;
};

/** 메인 피드 게시글 카드 */
export function Feed({
  id,
  nickname,
  profileUrl,
  images,
  caption,
  story = 'none',
  isFavorite = false,
  isStored = false,
}: FeedData) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [needsMore, setNeedsMore] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const leaveTimerRef = useRef<number | null>(null);
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

  const safeImages = images.length > 0 ? images : ['/images/mock/post_ex.jpg'];
  const hasMultiple = safeImages.length > 1;
  const showPrev = hasMultiple && index > 0;
  const showNext = hasMultiple && index < safeImages.length - 1;
  const captionParts = splitCaptionTags(caption);

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current != null) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const closeTag = useCallback(() => {
    clearLeaveTimer();
    setTagOpen(null);
  }, []);

  /** 클릭 등으로 모달 100% 오픈 */
  const openTagActive = (tagText: string, el: HTMLElement) => {
    const data = getTagExplain(tagText);
    if (!data) return;
    clearLeaveTimer();
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

  const scheduleCloseIfPreview = () => {
    if (Date.now() < ignoreLeaveUntilRef.current) return;
    clearLeaveTimer();
    leaveTimerRef.current = window.setTimeout(() => {
      setTagOpen((prev) => {
        if (!prev || prev.mode === 'active') return prev;
        return { ...prev, closeRequested: true };
      });
    }, 200);
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
      <header className={styles.header}>
        <Profile imageUrl={profileUrl} size={36} story={story} />
        <span className={styles.nickname}>{nickname}</span>
      </header>
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
            {safeImages.map((src, i) => (
              <SwiperSlide key={`${src}-${i}`}>
                <Image
                  src={src}
                  alt=""
                  width={430}
                  height={430}
                  className={styles.photo}
                  style={{ height: 'auto' }}
                />
              </SwiperSlide>
            ))}
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
            <button type="button" className={styles.actionBtn} aria-label="좋아요">
              <Image
                src={isFavorite ? FavoriteFillIcon : FavoriteIcon}
                alt=""
                width={25}
                height={25}
              />
            </button>
            <button type="button" className={styles.actionBtn} aria-label="댓글">
              <Image src={CommentIcon} alt="" width={21} height={20} />
            </button>
            <button type="button" className={styles.actionBtn} aria-label="공유">
              <Image src={ShareIcon} alt="" width={23} height={23} />
            </button>
          </div>
          <button type="button" className={styles.actionBtn} aria-label="저장">
            <Image src={isStored ? PinFillIcon : PinIcon} alt="" width={25} height={25} />
          </button>
        </div>

        <div className={styles.captionWrap}>
          <p ref={captionRef} className={clsx(styles.caption, !expanded && styles.captionClamped)}>
            <strong className={styles.captionNick}>{nickname}</strong>{' '}
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
                    openTagPreviewIfClosed(part.value, e.currentTarget);
                  }}
                  onMouseLeave={() => {
                    if (lastPointerTypeRef.current !== 'mouse') return;
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
    </article>
  );
}
