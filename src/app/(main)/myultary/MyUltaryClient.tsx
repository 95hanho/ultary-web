'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { LogoHeader } from '@/components/common/LogoHeader';
import { Profile } from '@/components/my-ultary/Profile';
import { MOCK_MY_FEEDS, MOCK_SAVED_FEEDS } from '@/lib/mock/feeds';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/free-mode';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './myultary.module.scss';

const AddIcon = '/images/icon/Add_round.svg';
const SettingIcon = '/images/icon/Setting_line.svg';
const EditIcon = '/images/icon/Edit.svg';
const CakeIcon = '/images/icon/cake.svg';
const SettingFillIcon = '/images/icon/Setting_fill.svg';
const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const ArrowRightIcon = '/images/icon/arrow_right.svg';
const MultiIcon = '/images/icon/multi.svg';

const StoryOffIcon = '/images/icon/Book_open_alt-off.svg';
const StoryOnIcon = '/images/icon/Book_open_alt-on.svg';
const StoryReadIcon = '/images/icon/Book_open_alt_read.svg';
const FeedOffIcon = '/images/icon/Order.svg';
const FeedOnIcon = '/images/icon/Order_on.svg';
const SavedOffIcon = '/images/icon/pin_off.svg';
const SavedOnIcon = '/images/icon/Pin_on.svg';
const GroupOffIcon = '/images/icon/Group_light.svg';

const BOTTOM_BG = '/images/ultary_bg_bt.png';

type AccountStoryStatus = 'none' | 'read' | 'unread';
type ContentTab = 'feed' | 'saved';

type Pet = {
  id: string;
  name: string;
  handle: string;
  gender: 'M' | 'F';
  bio: string;
  imageUrl: string;
  isBirthday?: boolean;
};

type FeedPost = {
  id: string;
  imageUrl: string;
  isMulti: boolean;
  href: string;
};

const MOCK_ACCOUNT = {
  nickname: 'HAN_HOSEONGS',
  postCount: 4,
  residentCount: 125,
  neighborCount: 128,
  bio: '오늘 공유한 나의 울타리 동물',
  storyStatus: 'unread' as AccountStoryStatus,
  isOwnAccount: true,
  groupTaggedUrl: '/myultary/tagged',
};

const MOCK_PETS: Pet[] = [
  {
    id: 'pet-1',
    name: '초코',
    handle: '@choco_01',
    gender: 'M',
    bio: '산책 좋아함',
    imageUrl: '/images/mock/profile.jpg',
    isBirthday: true,
  },
  {
    id: 'pet-2',
    name: '모카',
    handle: '@mocha_02',
    gender: 'F',
    bio: '낮잠 전문',
    imageUrl: '/images/mock/profile.jpg',
  },
  {
    id: 'pet-3',
    name: '바닐라',
    handle: '@vanilla_03',
    gender: 'F',
    bio: '간식 러버',
    imageUrl: '/images/mock/profile.jpg',
  },
  {
    id: 'pet-4',
    name: '쿠키',
    handle: '@cookie_04',
    gender: 'M',
    bio: '공놀이 좋아함',
    imageUrl: '/images/mock/profile.jpg',
  },
  {
    id: 'pet-5',
    name: '땅콩',
    handle: '@peanut_05',
    gender: 'M',
    bio: '겁 많음',
    imageUrl: '/images/mock/profile.jpg',
  },
];

const MOCK_FEED_POSTS: FeedPost[] = MOCK_MY_FEEDS.map((feed) => ({
  id: feed.id,
  imageUrl: feed.images[0] ?? '/images/mock/post_ex.jpg',
  isMulti: feed.images.length > 1,
  href: `/myultary/posts/${feed.id}`,
}));

const MOCK_SAVED_POSTS: FeedPost[] = MOCK_SAVED_FEEDS.map((feed) => ({
  id: feed.id,
  imageUrl: feed.images[0] ?? '/images/mock/post_ex.jpg',
  isMulti: feed.images.length > 1,
  href: `/myultary/saved/${feed.id}`,
}));

function getStoryIcon(status: AccountStoryStatus) {
  if (status === 'unread') return StoryOnIcon;
  if (status === 'read') return StoryReadIcon;
  return StoryOffIcon;
}

function getStoryTabClass(status: AccountStoryStatus) {
  if (status === 'unread') return styles.sideTabStoryUnread;
  if (status === 'read') return styles.sideTabStoryRead;
  return styles.sideTabStoryNone;
}

function syncPetNav(
  swiper: SwiperType,
  setCanPrev: (v: boolean) => void,
  setCanNext: (v: boolean) => void,
) {
  setCanPrev(!swiper.isBeginning);
  setCanNext(!swiper.isEnd);
}

function slidePetsByHalf(swiper: SwiperType, direction: 'prev' | 'next') {
  const half = swiper.width * 0.5;
  const current = swiper.getTranslate();
  const target = direction === 'next' ? current - half : current + half;
  const min = swiper.maxTranslate();
  const max = swiper.minTranslate();
  const clamped = Math.max(min, Math.min(max, target));
  swiper.translateTo(clamped, 300);
}

function FeedGrid({ posts }: { posts: FeedPost[] }) {
  return (
    <ul className={styles.feedGrid}>
      {posts.map((post) => (
        <li key={post.id} className={styles.feedItem}>
          <Link href={post.href} className={styles.feedItemLink} aria-label="게시글 보기">
            <Image
              src={post.imageUrl}
              alt=""
              width={200}
              height={200}
              className={styles.feedImg}
            />
            {post.isMulti ? (
              <span className={styles.multiBadge} aria-hidden>
                <Image src={MultiIcon} alt="" width={18} height={18} />
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 마이울타리 메인 */
export default function MyUltaryClient() {
  const petSwiperRef = useRef<SwiperType | null>(null);
  const [canPetPrev, setCanPetPrev] = useState(false);
  const [canPetNext, setCanPetNext] = useState(false);
  const [petViewMode, setPetViewMode] = useState<'carousel' | 'detail'>('carousel');
  const [selectedPetId, setSelectedPetId] = useState(MOCK_PETS[0]?.id ?? '');
  const [contentTab, setContentTab] = useState<ContentTab>('feed');

  const selectedPet = MOCK_PETS.find((pet) => pet.id === selectedPetId) ?? MOCK_PETS[0];
  const birthdayPet = MOCK_PETS.find((pet) => pet.isBirthday);
  const showPetNav = MOCK_PETS.length > 4;
  const posts = contentTab === 'feed' ? MOCK_FEED_POSTS : MOCK_SAVED_POSTS;

  const handlePetSelect = (petId: string) => {
    if (petViewMode === 'detail' && petId === selectedPetId) {
      setPetViewMode('carousel');
    } else {
      setSelectedPetId(petId);
      setPetViewMode('detail');
    }

    window.setTimeout(() => {
      petSwiperRef.current?.update();
    }, 320);
  };

  return (
    <div className={styles.shell}>
      <LogoHeader
        actions={
          <>
            <Link href="/myultary/write" className={styles.iconBtn} aria-label="글쓰기">
              <Image src={AddIcon} alt="" width={32} height={32} />
            </Link>
            <Link href="/settings" className={styles.iconBtn} aria-label="설정">
              <Image src={SettingIcon} alt="" width={32} height={32} />
            </Link>
          </>
        }
      />

      <section className={styles.profileSection} aria-label="프로필">
        <div className={styles.profileMain}>
          <h1 className={styles.nickname}>{MOCK_ACCOUNT.nickname}</h1>

          <ul className={styles.stats}>
            <li className={styles.statItem}>
              <strong>게시물</strong>
              {MOCK_ACCOUNT.postCount}
            </li>
            <li className={styles.statItem}>
              <strong>주민</strong>
              {MOCK_ACCOUNT.residentCount}
            </li>
            <li className={styles.statItem}>
              <strong>이웃</strong>
              {MOCK_ACCOUNT.neighborCount}
            </li>
          </ul>

          <div className={styles.bioRow}>
            <p className={styles.bio}>
              {MOCK_ACCOUNT.bio}
              {MOCK_ACCOUNT.isOwnAccount ? (
                <button type="button" className={styles.iconBtn} aria-label="소개글 수정">
                  <Image src={EditIcon} alt="" width={18} height={18} />
                </button>
              ) : null}
            </p>
          </div>

          {birthdayPet ? (
            <p className={styles.birthdayRow}>
              <span>🎂오늘 생일을 맞이한 {birthdayPet.name}를 축하해주세요.</span>
            </p>
          ) : null}

          <div
            className={clsx(
              styles.petArea,
              petViewMode === 'detail' && styles.petAreaDetail,
            )}
          >
            <div className={styles.petCarouselWrap}>
              <Swiper
                modules={[FreeMode]}
                slidesPerView="auto"
                spaceBetween={10}
                freeMode
                className={styles.petSwiper}
                onSwiper={(swiper) => {
                  petSwiperRef.current = swiper;
                  syncPetNav(swiper, setCanPetPrev, setCanPetNext);
                }}
                onProgress={(swiper) => {
                  syncPetNav(swiper, setCanPetPrev, setCanPetNext);
                }}
                onReachBeginning={(swiper) => {
                  syncPetNav(swiper, setCanPetPrev, setCanPetNext);
                }}
                onReachEnd={(swiper) => {
                  syncPetNav(swiper, setCanPetPrev, setCanPetNext);
                }}
                onFromEdge={(swiper) => {
                  syncPetNav(swiper, setCanPetPrev, setCanPetNext);
                }}
                onTransitionEnd={(swiper) => {
                  syncPetNav(swiper, setCanPetPrev, setCanPetNext);
                }}
              >
                {MOCK_PETS.map((pet) => (
                  <SwiperSlide key={pet.id} className={styles.petSlide}>
                    <button
                      type="button"
                      className={clsx(
                        styles.petCardBtn,
                        petViewMode === 'detail' &&
                          pet.id === selectedPetId &&
                          styles.petCardBtnSelected,
                      )}
                      onClick={() => handlePetSelect(pet.id)}
                      aria-label={`${pet.name} 상세 보기`}
                    >
                      <span className={styles.petCardPhoto}>
                        <Image
                          src={pet.imageUrl}
                          alt=""
                          width={80}
                          height={80}
                          className={styles.petCardImg}
                        />
                        {pet.isBirthday ? (
                          <span className={styles.petBirthdayBadge} aria-hidden>
                            <Image src={CakeIcon} alt="" width={30} height={30} />
                          </span>
                        ) : null}
                      </span>
                      <span className={styles.petCardName}>{pet.name}</span>
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>

              {petViewMode === 'carousel' && showPetNav && canPetPrev ? (
                <button
                  type="button"
                  className={clsx(styles.petNavBtn, styles.petNavPrev)}
                  onClick={() => {
                    const swiper = petSwiperRef.current;
                    if (swiper) slidePetsByHalf(swiper, 'prev');
                  }}
                  aria-label="이전 펫"
                >
                  <Image src={ArrowLeftIcon} alt="" width={14} height={14} />
                </button>
              ) : null}
              {petViewMode === 'carousel' && showPetNav && canPetNext ? (
                <button
                  type="button"
                  className={clsx(styles.petNavBtn, styles.petNavNext)}
                  onClick={() => {
                    const swiper = petSwiperRef.current;
                    if (swiper) slidePetsByHalf(swiper, 'next');
                  }}
                  aria-label="다음 펫"
                >
                  <Image src={ArrowRightIcon} alt="" width={14} height={14} />
                </button>
              ) : null}
            </div>

            {selectedPet ? (
              <div className={styles.petDetailCard} aria-hidden={petViewMode !== 'detail'}>
                <div className={styles.petDetailPhotoWrap}>
                  <Profile imageUrl={selectedPet.imageUrl} size={88} />
                  {MOCK_ACCOUNT.isOwnAccount ? (
                    <button
                      type="button"
                      className={styles.petSettingBtn}
                      aria-label={`${selectedPet.name} 설정`}
                      tabIndex={petViewMode === 'detail' ? 0 : -1}
                    >
                      <Image src={SettingFillIcon} alt="" width={30} height={30} />
                    </button>
                  ) : null}
                  {selectedPet.isBirthday ? (
                    <span className={styles.petBirthdayBadge} aria-hidden>
                      <Image src={CakeIcon} alt="" width={30} height={30} />
                    </span>
                  ) : null}
                </div>
                <div className={styles.petDetailInfo}>
                  <p className={styles.petName}>
                    {selectedPet.name}({selectedPet.gender})
                  </p>
                  <p className={styles.petHandle}>{selectedPet.handle}</p>
                  <p className={styles.petBio}>{selectedPet.bio}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <nav className={styles.sideTabs} aria-label="콘텐츠 메뉴">
          <Link
            href="/stories"
            className={clsx(styles.sideTabBtn, getStoryTabClass(MOCK_ACCOUNT.storyStatus))}
            aria-label="스토리"
          >
            <Image src={getStoryIcon(MOCK_ACCOUNT.storyStatus)} alt="" width={20} height={20} />
          </Link>

          <button
            type="button"
            className={clsx(
              styles.sideTabBtn,
              contentTab === 'feed' ? styles.sideTabActive : undefined,
            )}
            onClick={() => setContentTab('feed')}
            aria-label="피드"
            aria-pressed={contentTab === 'feed'}
          >
            <Image
              src={contentTab === 'feed' ? FeedOnIcon : FeedOffIcon}
              alt=""
              width={20}
              height={20}
            />
          </button>

          <button
            type="button"
            className={clsx(
              styles.sideTabBtn,
              contentTab === 'saved' ? styles.sideTabActive : undefined,
            )}
            onClick={() => setContentTab('saved')}
            aria-label="저장"
            aria-pressed={contentTab === 'saved'}
          >
            <Image
              src={contentTab === 'saved' ? SavedOnIcon : SavedOffIcon}
              alt=""
              width={20}
              height={20}
            />
          </button>

          <Link href={MOCK_ACCOUNT.groupTaggedUrl} className={styles.sideTabBtn} aria-label="그룹">
            <Image src={GroupOffIcon} alt="" width={20} height={20} />
          </Link>
        </nav>
      </section>

      <section className={styles.feedSection} aria-label="게시물 그리드">
        <FeedGrid posts={posts} />
      </section>

      <Image src={BOTTOM_BG} alt="" width={430} height={120} className={styles.bottomBg} />

      <FooterMenu />
    </div>
  );
}
