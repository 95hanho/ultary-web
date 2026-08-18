'use client';

import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import clsx from 'clsx';
import Image from 'next/image';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './Feed.module.scss';

/** 피드 액션 아이콘 (public) */
const FavoriteIcon = '/images/icon/Favorite.svg';
const FavoriteFillIcon = '/images/icon/Favorite_fill.svg'; // 좋아요 ON — 연결 전
const CommentIcon = '/images/icon/comment.svg';
const ShareIcon = '/images/icon/share.svg';
const PinIcon = '/images/icon/Pin.svg';
const PinFillIcon = '/images/icon/Pin_fill.svg';
const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const ArrowRightIcon = '/images/icon/arrow_right.svg';

export type FeedProps = {
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
  nickname,
  profileUrl,
  images,
  caption,
  story = 'none',
  isFavorite = false,
  isStored = false,
}: FeedProps) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [needsMore, setNeedsMore] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const safeImages = images.length > 0 ? images : ['/images/mock/post_ex.jpg'];
  const hasMultiple = safeImages.length > 1;
  const showPrev = hasMultiple && index > 0;
  const showNext = hasMultiple && index < safeImages.length - 1;

  useLayoutEffect(() => {
    const el = captionRef.current;
    if (!el) return;

    if (expanded) {
      // 이펙트에서 상태를 동기적으로 설정하지 마세요. expanded가 false일 때 needsMore가 아래에서 다시 계산됩니다.
      return;
    }

    const measure = () => {
      // max-height 클램프: scrollHeight > clientHeight 가 안정적으로 잡힘
      setNeedsMore(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [caption, nickname, expanded]);

  return (
    <article className={styles.feed}>
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
            <strong className={styles.captionNick}>{nickname}</strong> {caption}
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
    </article>
  );
}
