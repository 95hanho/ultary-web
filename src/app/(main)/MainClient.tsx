'use client';

import Image from 'next/image';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/free-mode';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { FooterMenu } from '@/components/common/FooterMenu';
import { Feed } from '@/components/feed/Feed';
import { Profile } from '@/components/my-ultary/Profile';
import styles from './Main.module.scss';

const LogoIcon = '/images/icon/ultary_logo.png';
const SettingIcon = '/images/icon/Setting_line.svg';

const MOCK_PROFILE = '/images/mock/profile.jpg';
const MOCK_POST = '/images/mock/post_ex.jpg';

const STORY_USERS = [
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE, active: true },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE },
  { nickname: 'HAN_HOSEONGS...', imageUrl: MOCK_PROFILE },
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

export default function MainClient() {
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
          >
            {STORY_USERS.map((user, i) => (
              <SwiperSlide key={`${user.nickname}-${i}`} className={styles.storySlide}>
                <div className={styles.storyItem}>
                  <Profile
                    imageUrl={user.imageUrl}
                    size={80}
                    active={user.active}
                  />
                  <span className={styles.storyNickname}>{user.nickname}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
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
