'use client';

import { Profile } from '@/components/my-ultary/Profile';
import clsx from 'clsx';
import Image from 'next/image';
import { useRef, useState } from 'react';
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
const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const ArrowRightIcon = '/images/icon/arrow_right.svg';

export type FeedProps = {
  nickname: string;
  profileUrl: string;
  /** 캐러셀용. 목업은 같은 사진 여러 장도 OK */
  images: string[];
  caption: string;
  /** 스토리 미확인 프로필 링 */
  profileActive?: boolean;
  /** 좋아요 여부 */
  isFavorite?: boolean;
};

/** 메인 피드 게시글 카드 */
export function Feed({
  nickname,
  profileUrl,
  images,
  caption,
  profileActive = false,
  isFavorite = false,
}: FeedProps) {
  const [index, setIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const safeImages = images.length > 0 ? images : ['/images/mock/post_ex.jpg'];
  const hasMultiple = safeImages.length > 1;
  const showPrev = hasMultiple && index > 0;
  const showNext = hasMultiple && index < safeImages.length - 1;

  return (
    <article className={styles.feed}>
      <header className={styles.header}>
        <Profile imageUrl={profileUrl} size={36} active={profileActive} />
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
            <Image src={PinIcon} alt="" width={25} height={25} />
          </button>
        </div>

        <p className={styles.caption}>
          <strong className={styles.captionNick}>{nickname}</strong> {caption}
        </p>
      </div>
    </article>
  );
}
