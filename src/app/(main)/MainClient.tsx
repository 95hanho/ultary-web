'use client';
import { nicknameTag } from '@/lib/nickname-tag';
import { orderMainStoryOwners } from '@/lib/story/main-story-order';
import {
  ensureMainFeedSession,
  getMainFeedSession,
  getMainFeedServerSnapshot,
  getMainScroll,
  loadMoreMainFeeds,
  saveMainScroll,
  subscribeMainFeedSession,
} from '@/lib/feed/main-session';
import { readPendingFeedEditReturn } from '@/lib/feed/edit-return';
import { insertFeedAdvertisements } from '@/lib/feed/main-feed-ads';
import { restoreMainScroll } from '@/lib/feed/main-scroll';
import { PageLoadError } from '@/components/common/PageLoadError';
import { PetNamesAndNicknameTag } from '@/components/common/PetNamesAndNicknameTag';
import { PetProfileGroup } from '@/components/my-ultary/PetProfileGroup';
import type { SubjectPet } from '@/types/pet';

import { FooterMenu } from '@/components/common/FooterMenu';
import { LogoHeader } from '@/components/common/LogoHeader';
import { LogoLoading } from '@/components/common/LogoLoading';
import { FeedList } from '@/components/feed/FeedList';
import { InfiniteFeedFooter } from '@/components/feed/InfiniteFeedFooter';
import { FirstActivityGuide } from '@/components/feed/FirstActivityGuide';
import { Profile, type StoryStatus } from '@/components/my-ultary/Profile';
import { StoryOpenButton } from '@/components/story/StoryOpenButton';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { readFileAsDataUrl } from '@/lib/pending-pet-photo';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { useStoryDraftStore } from '@/stores/story-draft.store';
import type { MeResponse } from '@/types/api';
import type { StoryOwner } from '@/types/story';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';
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
  subjectNames?: string[];
  subjectPets?: SubjectPet[];
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
    subjectNames: (o.subjectPets ?? []).map((pet) => pet.name),
    subjectPets: o.subjectPets ?? [],
    imageUrl:
      resolveFileDisplayUrl(o.subjectPets?.[0]?.profileFile ?? o.profileFile) ?? FALLBACK_PROFILE,
    story: o.hasUnviewed ? 'unread' : 'read',
  }));
}

function withMyStoryAdd(owners: StoryOwner[], me: MeResponse | null): StoryRing[] {
  const rings = ownersToRings(orderMainStoryOwners(owners, me?.userNo));
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

export default function MainClient() {
  const router = useRouter();
  const storySwiperRef = useRef<SwiperType | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);
  const clearStoryDraft = useStoryDraftStore((s) => s.clear);
  const setStoryMedia = useStoryDraftStore((s) => s.setMedia);
  const [canStoryPrev, setCanStoryPrev] = useState(false);
  const [canStoryNext, setCanStoryNext] = useState(false);
  const session = useSyncExternalStore(
    subscribeMainFeedSession,
    getMainFeedSession,
    getMainFeedServerSnapshot,
  );
  const { feeds, recommended, ready, timelineCursor, recommendedCursor, loadingMore, moreError } =
    session;
  const timelineWithAds = insertFeedAdvertisements(feeds, session.advertisements);
  const recommendedWithAds = insertFeedAdvertisements(
    [...feeds, ...recommended],
    session.advertisements,
  ).slice(timelineWithAds.length);
  const myNickname = session.me?.nickname ?? null;
  const storyUsers = withMyStoryAdd(session.owners, session.me);

  useEffect(() => {
    void ensureMainFeedSession();
  }, []);

  useEffect(() => {
    if (!ready || session.error || readPendingFeedEditReturn()) return;
    return restoreMainScroll(getMainScroll());
  }, [ready, session.error, session.revision]);

  useEffect(() => {
    if (!ready || session.error) return;
    const save = () => saveMainScroll(window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      window.removeEventListener('scroll', save);
    };
  }, [ready, session.error]);

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

  if (session.error)
    return (
      <>
        <PageLoadError error={session.error} />
        <FooterMenu />
      </>
    );

  return (
    <div className={styles.shell} onClickCapture={() => saveMainScroll(window.scrollY)}>
      <LogoHeader hideOnDesktop />

      <main className={styles.main} aria-busy={session.loading}>
        <section className={styles.stories} aria-label="스토리">
          {storyUsers.length > 0 ? (
            <>
              <Swiper
                modules={[FreeMode]}
                slidesPerView="auto"
                spaceBetween={0}
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
                    className={clsx(
                      styles.storySlide,
                      user.userNo === session.me?.userNo &&
                        (user.mineAdd || user.story === 'unread') &&
                        styles.storyOwnPriority,
                    )}
                  >
                    <div className={styles.storyItem}>
                      {user.mineAdd ? (
                        <button
                          type="button"
                          className={styles.storyMineBtn}
                          aria-label="스토리 업"
                          onClick={() => storyFileInputRef.current?.click()}
                        >
                          <Profile imageUrl={user.imageUrl} size={80} story="none" />
                          <span className={styles.storyPlus} aria-hidden>
                            <Plus size={14} strokeWidth={2.75} />
                          </span>
                        </button>
                      ) : (
                        <StoryOpenButton
                          href={storyHref(user)}
                          aria-label={`${nicknameTag(user.nickname)} 스토리`}
                        >
                          <PetProfileGroup
                            pets={user.subjectPets ?? []}
                            fallbackImage={user.imageUrl}
                            size={80}
                            story={user.story}
                            layout="stack"
                          />
                        </StoryOpenButton>
                      )}
                      <Link href={myUltaryPath(user.nickname)} className={styles.storyNickname}>
                        <PetNamesAndNicknameTag
                          nickname={user.nickname}
                          petNames={user.subjectNames ?? []}
                        />
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

        {myNickname ? <FirstActivityGuide nickname={myNickname} /> : null}
        <FeedList feeds={timelineWithAds} />

        {feeds.length === 0 ? (
          <div className={styles.feedEmpty}>
            <p className={styles.feedEndMessage}>게시글이 없습니다. 팔로우를 늘려보세요.</p>
          </div>
        ) : null}

        {timelineCursor == null && recommended.length > 0 ? (
          <>
            {feeds.length > 0 ? (
              <div className={styles.feedEnd}>
                <p className={styles.recommendBtn}>추천게시글</p>
              </div>
            ) : null}
            <FeedList feeds={recommendedWithAds} label="추천 게시글" />
          </>
        ) : null}
        <InfiniteFeedFooter
          hasMore={timelineCursor != null || recommendedCursor != null}
          loading={loadingMore || session.loading}
          error={moreError}
          onLoadMore={() => {
            void loadMoreMainFeeds();
          }}
        />
      </main>

      <FooterMenu />
    </div>
  );
}
