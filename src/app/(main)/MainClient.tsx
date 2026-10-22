'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import { FooterMenu } from '@/components/common/FooterMenu';
import { LogoHeader } from '@/components/common/LogoHeader';
import { LogoLoading } from '@/components/common/LogoLoading';
import { FeedList } from '@/components/feed/FeedList';
import type { FeedData } from '@/components/feed/Feed';
import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedDataList } from '@/lib/feed/toFeedData';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { readFileAsDataUrl } from '@/lib/pending-pet-photo';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { useStoryDraftStore } from '@/stores/story-draft.store';
import type { BffEnvelope, MeResponse } from '@/types/api';
import type { StoryOwner } from '@/types/story';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
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
  /** 내 활성 스토리가 없을 때 맨 앞 추가 칸 */
  mineAdd?: boolean;
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

function withMyStoryAdd(owners: StoryOwner[], me: MeResponse | null): StoryRing[] {
  const rings = ownersToRings(owners);
  if (!me) return rings;
  if (rings.some((ring) => ring.userNo === me.userNo)) return rings;
  return [
    {
      userNo: me.userNo,
      nickname: me.nickname,
      imageUrl: resolveFileDisplayUrl(me.profileFile) ?? FALLBACK_PROFILE,
      story: 'none',
      mineAdd: true,
    },
    ...rings,
  ];
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
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
  const router = useRouter();
  const storySwiperRef = useRef<SwiperType | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const clearStoryDraft = useStoryDraftStore((s) => s.clear);
  const setStoryMedia = useStoryDraftStore((s) => s.setMedia);
  const [canStoryPrev, setCanStoryPrev] = useState(false);
  const [canStoryNext, setCanStoryNext] = useState(false);
  const [feeds, setFeeds] = useState<FeedData[]>([]);
  const [recommended, setRecommended] = useState<FeedData[]>([]);
  const [storyUsers, setStoryUsers] = useState<StoryRing[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [feedsRes, ownersRes, meRes, recommendedRes] = await Promise.all([
          bffGet<BffEnvelope<unknown>>(bffEndpoints.main.feeds, { size: 20 }),
          bffGet<BffEnvelope<StoryOwner[]>>(bffEndpoints.main.storyOwners),
          bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me),
          bffGet<BffEnvelope<unknown>>(bffEndpoints.main.feedsRecommended, { limit: 10 }),
        ]);
        if (cancelled) return;

        const owners = unwrapOwners(ownersRes.data ?? ownersRes);
        const mapped = toFeedDataList(feedsRes.data ?? feedsRes);
        setFeeds(applyOwnerStory(mapped, owners));
        if (recommendedRes) {
          setRecommended(
            applyOwnerStory(toFeedDataList(recommendedRes.data ?? recommendedRes), owners),
          );
        }

        const me = meRes?.data ?? null;
        setStoryUsers(withMyStoryAdd(owners, me));
      } catch (err) {
        console.error('[main] BFF load failed', err);
        if (!cancelled) setLoadFailed({ error: err });
        if (!cancelled) setFeeds([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <LogoLoading />;
  }

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
      console.error('[main] story file', err);
    }
  };

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

  return (
    <div className={styles.shell}>
      <LogoHeader hideOnDesktop />

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
                    key={user.mineAdd ? 'mine-add' : user.userNo}
                    className={styles.storySlide}
                  >
                    <div className={styles.storyItem}>
                      {user.mineAdd ? (
                        <button
                          type="button"
                          className={styles.storyMineBtn}
                          aria-label="스토리 업"
                          onClick={() => storyFileInputRef.current?.click()}
                        >
                          <Profile
                            imageUrl={user.imageUrl}
                            size={80}
                            story="none"
                          />
                          <span className={styles.storyPlus} aria-hidden>
                            <Plus size={14} strokeWidth={2.75} />
                          </span>
                        </button>
                      ) : (
                        <Link href={storyHref(user)} aria-label={`${user.nickname} 스토리`}>
                          <Profile
                            imageUrl={user.imageUrl}
                            size={80}
                            story={user.story}
                          />
                        </Link>
                      )}
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
          ) : (
            <p className={styles.storyEmpty}>스토리가 없습니다</p>
          )}
        </section>

        <input
          ref={storyFileInputRef}
          type="file"
          accept="image/*,video/*"
          className={styles.storyFileInput}
          onChange={(event) => void handleStoryFileChange(event)}
        />

        <FeedList feeds={feeds} />

        {feeds.length === 0 ? (
          <div className={styles.feedEmpty}>
            <p className={styles.feedEndMessage}>게시글이 없습니다. 팔로우를 늘려보세요.</p>
          </div>
        ) : null}

        {recommended.length > 0 ? (
          <>
            {feeds.length > 0 ? (
              <div className={styles.feedEnd}>
                <p className={styles.recommendBtn}>추천게시글</p>
              </div>
            ) : null}
            <FeedList feeds={recommended} label="추천 게시글" />
          </>
        ) : null}
      </main>

      <FooterMenu />
    </div>
  );
}
