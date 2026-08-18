'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { Feed } from '@/components/feed/Feed';
import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/free-mode';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './main.module.scss';

const LogoIcon = '/images/icon/ultary_logo.png';
const SettingIcon = '/images/icon/Setting_line.svg';
const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const ArrowRightIcon = '/images/icon/arrow_right.svg';

const MOCK_PROFILE = '/images/mock/profile.jpg';
const MOCK_POST = '/images/mock/post_ex.jpg';

const STORY_USERS: {
  nickname: string;
  imageUrl: string;
  story: StoryStatus;
}[] = [
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE, story: 'unread' },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE, story: 'read' },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE, story: 'none' },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE, story: 'unread' },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE, story: 'read' },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE, story: 'none' },
];

const FEEDS = [
  {
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST, MOCK_POST, MOCK_POST],
    caption:
      '내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용',
  },
  {
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST, MOCK_POST],
    caption: '내용내용내용내용내용내용내용내용내용내용',
  },
  {
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST],
    caption: '내용내용내용내용내용내용내용내용',
  },
];

function syncStoryNav(
  swiper: SwiperType,
  setCanPrev: (v: boolean) => void,
  setCanNext: (v: boolean) => void,
) {
  setCanPrev(!swiper.isBeginning);
  setCanNext(!swiper.isEnd);
}

/** 뷰포트 너비의 절반만큼 이동 */
function slideStoriesByHalf(swiper: SwiperType, direction: 'prev' | 'next') {
  const half = swiper.width * 0.5;
  const current = swiper.getTranslate();
  const target = direction === 'next' ? current - half : current + half;
  const min = swiper.maxTranslate();
  const max = swiper.minTranslate();
  const clamped = Math.max(min, Math.min(max, target));
  swiper.translateTo(clamped, 300);
}

export default function MainClient() {
  const storySwiperRef = useRef<SwiperType | null>(null);
  const [canStoryPrev, setCanStoryPrev] = useState(false);
  const [canStoryNext, setCanStoryNext] = useState(false);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Image
          src={LogoIcon}
          alt="ULTARY"
          width={120}
          height={36}
          priority
          className={styles.logo}
          style={{ height: 'auto' }}
        />
        <Link href="/settings" className={styles.settingBtn} aria-label="설정">
          <Image src={SettingIcon} alt="" width={35} height={35} />
        </Link>
      </header>

      <main className={styles.main}>
        <section className={styles.stories} aria-label="스토리">
          <Swiper
            modules={[FreeMode]}
            slidesPerView="auto"
            spaceBetween={15}
            freeMode
            className={styles.storySwiper}
            onSwiper={(swiper) => {
              storySwiperRef.current = swiper;
              syncStoryNav(swiper, setCanStoryPrev, setCanStoryNext);
            }}
            onProgress={(swiper) => {
              syncStoryNav(swiper, setCanStoryPrev, setCanStoryNext);
            }}
            onReachBeginning={(swiper) => {
              syncStoryNav(swiper, setCanStoryPrev, setCanStoryNext);
            }}
            onReachEnd={(swiper) => {
              syncStoryNav(swiper, setCanStoryPrev, setCanStoryNext);
            }}
            onFromEdge={(swiper) => {
              syncStoryNav(swiper, setCanStoryPrev, setCanStoryNext);
            }}
            onTransitionEnd={(swiper) => {
              syncStoryNav(swiper, setCanStoryPrev, setCanStoryNext);
            }}
          >
            {STORY_USERS.map((user, i) => (
              <SwiperSlide key={`${user.nickname}-${i}`} className={styles.storySlide}>
                <div className={styles.storyItem}>
                  <Profile imageUrl={user.imageUrl} size={80} story={user.story} />
                  <span className={styles.storyNickname}>{user.nickname}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {canStoryPrev ? (
            <button
              type="button"
              className={clsx(styles.navBtn, styles.navPrev)}
              onClick={() => {
                const swiper = storySwiperRef.current;
                if (swiper) slideStoriesByHalf(swiper, 'prev');
              }}
              aria-label="이전 스토리"
            >
              <Image src={ArrowLeftIcon} alt="" width={16} height={16} />
            </button>
          ) : null}
          {canStoryNext ? (
            <button
              type="button"
              className={clsx(styles.navBtn, styles.navNext)}
              onClick={() => {
                const swiper = storySwiperRef.current;
                if (swiper) slideStoriesByHalf(swiper, 'next');
              }}
              aria-label="다음 스토리"
            >
              <Image src={ArrowRightIcon} alt="" width={16} height={16} />
            </button>
          ) : null}
        </section>

        <section className={styles.feeds} aria-label="게시글">
          {FEEDS.map((feed, i) => (
            <Feed key={i} {...feed} />
          ))}
        </section>
      </main>

      <FooterMenu />
    </div>
  );
}
