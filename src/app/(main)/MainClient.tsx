'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { LogoHeader } from '@/components/common/LogoHeader';
import { FeedList } from '@/components/feed/FeedList';
import type { FeedData } from '@/components/feed/Feed';
import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedDataList } from '@/lib/feed/toFeedData';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { MOCK_HOME_FEEDS } from '@/lib/mock/feeds';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import type { BffEnvelope } from '@/types/api';
import type { StoryOwner } from '@/types/story';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/free-mode';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './main.module.scss';

const ArrowLeftIcon = '/images/icon/arrow_left.svg';
const ArrowRightIcon = '/images/icon/arrow_right.svg';
const FALLBACK_PROFILE = NO_PROFILE_SRC;

type StoryRing = {
  userNo: number;
  nickname: string;
  imageUrl: string;
  story: StoryStatus;
};

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

function storyHref(user: StoryRing) {
  const q = new URLSearchParams({
    userNo: String(user.userNo),
    nickname: user.nickname,
    from: String(user.userNo),
  });
  if (user.story === 'unread') q.set('chain', 'unread');
  return `/stories?${q.toString()}`;
}

function ownersToRings(owners: StoryOwner[]): StoryRing[] {
  return owners.map((o) => ({
    userNo: o.userNo,
    nickname: o.nickname,
    imageUrl: resolveFileDisplayUrl(o.profileFile) ?? FALLBACK_PROFILE,
    story: o.hasUnviewed ? 'unread' : 'read',
  }));
}

/** 피드 프로필: 안 읽은 스토리만 unread, 없거나 다 읽었으면 none */
function applyOwnerStory(feeds: FeedData[], owners: StoryOwner[]): FeedData[] {
  const byUser = new Map(owners.map((o) => [o.userNo, o]));
  const byNick = new Map(owners.map((o) => [o.nickname, o]));

  return feeds.map((feed) => {
    const owner =
      (feed.userNo != null ? byUser.get(feed.userNo) : undefined) ??
      byNick.get(feed.nickname);
    return {
      ...feed,
      userNo: feed.userNo ?? owner?.userNo,
      story: owner?.hasUnviewed ? 'unread' : 'none',
    };
  });
}

function unwrapOwners(raw: unknown): StoryOwner[] {
  if (Array.isArray(raw)) return raw as StoryOwner[];
  if (raw && typeof raw === 'object') {
    const data = (raw as BffEnvelope<StoryOwner[]>).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

export default function MainClient() {
  const storySwiperRef = useRef<SwiperType | null>(null);
  const [canStoryPrev, setCanStoryPrev] = useState(false);
  const [canStoryNext, setCanStoryNext] = useState(false);
  const [feeds, setFeeds] = useState<FeedData[]>(MOCK_HOME_FEEDS);
  const [recommended, setRecommended] = useState<FeedData[]>([]);
  const [showRecommended, setShowRecommended] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [storyUsers, setStoryUsers] = useState<StoryRing[]>([]);
  const ownersRef = useRef<StoryOwner[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [feedsRes, ownersRes] = await Promise.all([
          bffGet<BffEnvelope<unknown>>(bffEndpoints.main.feeds, { size: 20 }),
          bffGet<BffEnvelope<StoryOwner[]>>(bffEndpoints.main.storyOwners),
        ]);
        if (cancelled) return;

        const owners = unwrapOwners(ownersRes.data ?? ownersRes);
        ownersRef.current = owners;
        const mapped = toFeedDataList(feedsRes.data ?? feedsRes);
        if (mapped.length > 0) setFeeds(applyOwnerStory(mapped, owners));

        if (owners.length > 0) setStoryUsers(ownersToRings(owners));
      } catch (err) {
        console.error('[main] BFF load failed, using mock', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openRecommended() {
    if (recommendLoading || showRecommended) return;
    setRecommendLoading(true);
    try {
      const res = await bffGet<BffEnvelope<unknown>>(
        bffEndpoints.main.feedsRecommended,
        { limit: 10 },
      );
      const list = applyOwnerStory(
        toFeedDataList(res.data ?? res),
        ownersRef.current,
      );
      if (list.length === 0) return;
      setRecommended(list);
      setShowRecommended(true);
    } catch (err) {
      console.error('[main] recommended failed', err);
    } finally {
      setRecommendLoading(false);
    }
  }

  return (
    <div className={styles.shell}>
      <LogoHeader />

      <main className={styles.main}>
        <section className={styles.stories} aria-label="스토리">
          {storyUsers.length > 0 ? (
            <>
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
                {storyUsers.map((user) => (
                  <SwiperSlide
                    key={user.userNo}
                    className={styles.storySlide}
                  >
                    <div className={styles.storyItem}>
                      <Link href={storyHref(user)} aria-label={`${user.nickname} 스토리`}>
                        <Profile
                          imageUrl={user.imageUrl}
                          size={80}
                          story={user.story}
                        />
                      </Link>
                      <Link href={myUltaryPath(user.nickname)} className={styles.storyNickname}>
                        {user.nickname}
                      </Link>
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
            </>
          ) : null}
        </section>

        <FeedList feeds={feeds} />

        {feeds.length > 0 ? (
          <div className={styles.feedEnd}>
            <p className={styles.feedEndMessage}>
              {showRecommended
                ? '여기부터 추천게시글입니다'
                : '마지막 게시글입니다.'}
            </p>
            {showRecommended ? null : (
              <button
                type="button"
                className={styles.recommendBtn}
                disabled={recommendLoading}
                onClick={() => {
                  void openRecommended();
                }}
              >
                추천게시글 보기
              </button>
            )}
          </div>
        ) : null}
        {showRecommended ? (
          <FeedList feeds={recommended} label="추천 게시글" />
        ) : null}
      </main>

      <FooterMenu />
    </div>
  );
}
