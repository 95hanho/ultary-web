'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { LogoHeader } from '@/components/common/LogoHeader';
import { FeedGrid, type FeedGridItem } from '@/components/feed/FeedGrid';
import { Profile } from '@/components/my-ultary/Profile';
import { bffEndpoints } from '@/lib/api/endpoints';
import { bffGet, bffPatchJson } from '@/lib/api/bffFetch';
import type { BffEnvelope } from '@/types/api';
import { MOCK_MY_FEEDS, MOCK_SAVED_FEEDS } from '@/lib/mock/feeds';
import { getUltaryAccount, MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import {
  mapFeedGrid,
  mapMyPets,
  mapMyUltaryProfile,
  storyRingStatus,
  type MyUltaryPetCard,
  type MyUltaryProfile,
} from '@/lib/myultary/fromApi';
import { mapSearchUsers } from '@/lib/search/accounts';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { readFileAsDataUrl, setPendingPetPhoto } from '@/lib/pending-pet-photo';
import {
  clearUltaryGridScroll,
  readUltaryGridScroll,
  saveUltaryGridScroll,
} from '@/lib/myultary/gridScroll';
import { useWriteDraftStore } from '@/stores/write-draft.store';
import { useStoryDraftStore } from '@/stores/story-draft.store';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { MediaImage } from '@/components/common/MediaImage';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
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

const StoryOffIcon = '/images/icon/Book_open_alt-off.svg';
const StoryOnIcon = '/images/icon/Book_open_alt-on.svg';
const StoryReadIcon = '/images/icon/Book_open_alt_read.svg';
const FeedOffIcon = '/images/icon/Order.svg';
const FeedOnIcon = '/images/icon/Order_on.svg';
const SavedOffIcon = '/images/icon/pin_off.svg';
const SavedOnIcon = '/images/icon/Pin_on.svg';
const GroupOffIcon = '/images/icon/Group_light.svg';
const GroupOnIcon = '/images/icon/Group_light_on.svg';

type AccountStoryStatus = 'none' | 'read' | 'unread';
type ContentTab = 'feed' | 'saved' | 'tagged';

type Pet = MyUltaryPetCard;

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
    isBirthday: false,
  },
  {
    id: 'pet-3',
    name: '바닐라',
    handle: '@vanilla_03',
    gender: 'F',
    bio: '간식 러버',
    imageUrl: '/images/mock/profile.jpg',
    isBirthday: false,
  },
  {
    id: 'pet-4',
    name: '쿠키',
    handle: '@cookie_04',
    gender: 'M',
    bio: '공놀이 좋아함',
    imageUrl: '/images/mock/profile.jpg',
    isBirthday: false,
  },
  {
    id: 'pet-5',
    name: '땅콩',
    handle: '@peanut_05',
    gender: 'M',
    bio: '겁 많음',
    imageUrl: '/images/mock/profile.jpg',
    isBirthday: false,
  },
];

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

type MyUltaryClientProps = {
  nickname: string;
};

/** 마이울타리 (/myultary/[nickname]) — 내 계정·다른 사람 모두 API, 예시 계정만 mock */
export default function MyUltaryClient({ nickname }: MyUltaryClientProps) {
  const router = useRouter();
  const mockAccount = getUltaryAccount(nickname);
  const expectsOwn = !mockAccount || mockAccount.isOwnAccount;
  const basePath = myUltaryPath(nickname);

  const petSwiperRef = useRef<SwiperType | null>(null);
  const petPhotoInputRef = useRef<HTMLInputElement>(null);
  const [canPetPrev, setCanPetPrev] = useState(false);
  const [canPetNext, setCanPetNext] = useState(false);
  const [petViewMode, setPetViewMode] = useState<'carousel' | 'detail'>('carousel');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [contentTab, setContentTab] = useState<ContentTab>('feed');
  const pendingGridScrollY = useRef<number | null>(null);
  const [photoTargetPetId, setPhotoTargetPetId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MyUltaryProfile | null>(null);
  const [viewingOwn, setViewingOwn] = useState(mockAccount?.isOwnAccount === true);
  const [profileReady, setProfileReady] = useState(!expectsOwn);
  const [unknownAccount, setUnknownAccount] = useState(false);
  const [apiPets, setApiPets] = useState<Pet[]>([]);
  const [apiFeedPosts, setApiFeedPosts] = useState<FeedGridItem[]>([]);
  const [savedApiPosts, setSavedApiPosts] = useState<FeedGridItem[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<FeedGridItem[]>([]);
  const [feedsReady, setFeedsReady] = useState(!expectsOwn);
  const [savedReady, setSavedReady] = useState(!expectsOwn);
  const [taggedReady, setTaggedReady] = useState(!expectsOwn);
  const [bio, setBio] = useState(() => (expectsOwn ? '' : (mockAccount?.bio ?? '')));
  const [savedBio, setSavedBio] = useState(() => (expectsOwn ? '' : (mockAccount?.bio ?? '')));
  const [editingBio, setEditingBio] = useState(false);
  const bioInputRef = useRef<HTMLInputElement>(null);

  const openModal = useModalStore((s) => s.open);
  const setWriteItems = useWriteDraftStore((s) => s.setItems);
  const clearWriteDraft = useWriteDraftStore((s) => s.clear);
  const setStoryMedia = useStoryDraftStore((s) => s.setMedia);
  const clearStoryDraft = useStoryDraftStore((s) => s.clear);
  const writeFileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  const pets = expectsOwn ? apiPets : MOCK_PETS;
  const singlePet = pets.length === 1;
  const activePetView = singlePet ? 'detail' : petViewMode;
  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0];
  const birthdayPet = pets.find((pet) => pet.isBirthday);
  const showPetNav = pets.length > 4;
  const isOwnAccount = viewingOwn && !unknownAccount;
  const storyStatus: AccountStoryStatus = profile
    ? storyRingStatus(profile)
    : (mockAccount?.storyStatus ?? 'none');
  const displayNickname = expectsOwn
    ? (profile?.nickname ?? nickname)
    : (mockAccount?.nickname ?? nickname);
  const postCount = expectsOwn ? (profile?.feedCount ?? 0) : (mockAccount?.postCount ?? 0);
  const residentCount = expectsOwn
    ? (profile?.residentCount ?? 0)
    : (mockAccount?.residentCount ?? 0);
  const neighborCount = expectsOwn
    ? (profile?.neighborCount ?? 0)
    : (mockAccount?.neighborCount ?? 0);

  useEffect(() => {
    if (!editingBio) return;
    const input = bioInputRef.current;
    if (!input) return;
    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }, [editingBio]);

  const finishEditBio = () => {
    const next = bio.trim();
    setBio(next);
    setEditingBio(false);
    if (!expectsOwn || next === savedBio) return;
    void (async () => {
      try {
        await bffPatchJson<BffEnvelope<unknown>, { bio: string }>(
          bffEndpoints.myUltary.bio,
          { bio: next },
        );
        setSavedBio(next);
        setProfile((prev) => (prev ? { ...prev, bio: next } : prev));
      } catch (err) {
        console.error('[myultary] bio update failed', err);
        setBio(savedBio);
      }
    })();
  };

  useEffect(() => {
    if (!expectsOwn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.profile);
        const nextProfile = mapMyUltaryProfile(res.data);
        if (cancelled) return;
        const isMine =
          nickname === MY_NICKNAME ||
          (nextProfile != null && nickname === nextProfile.nickname);
        if (isMine && nextProfile) {
          setViewingOwn(true);
          setProfile(nextProfile);
          setBio(nextProfile.bio);
          setSavedBio(nextProfile.bio);
          setProfileReady(true);

          const [petsRes, feedsRes] = await Promise.all([
            bffGet<BffEnvelope<unknown>>(bffEndpoints.pets.root),
            bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.feeds, { size: 21 }),
          ]);
          if (cancelled) return;
          const nextPets = mapMyPets(petsRes.data, NO_PROFILE_SRC);
          setApiPets(nextPets);
          setSelectedPetId((current) =>
            nextPets.some((pet) => pet.id === current) ? current : (nextPets[0]?.id ?? ''),
          );
          setApiFeedPosts(
            mapFeedGrid(feedsRes.data, (id) => `${basePath}/posts/${id}`),
          );
          setFeedsReady(true);
          return;
        }

        const searchRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
          q: nickname,
          type: 'USER',
        });
        if (cancelled) return;
        const matched = mapSearchUsers(searchRes.data).find(
          (user) => user.nickname === nickname && user.userNo != null,
        );
        if (!matched?.userNo) {
          setUnknownAccount(true);
          return;
        }
        const otherUserNo = matched.userNo;
        const [otherRes, petsRes, feedsRes] = await Promise.all([
          bffGet<BffEnvelope<unknown>>(bffEndpoints.users.ultary, { userNo: otherUserNo }),
          bffGet<BffEnvelope<unknown>>(bffEndpoints.users.pets, { userNo: otherUserNo }),
          bffGet<BffEnvelope<unknown>>(bffEndpoints.users.feeds, {
            userNo: otherUserNo,
            size: 21,
          }),
        ]);
        if (cancelled) return;
        const otherProfile = mapMyUltaryProfile(otherRes.data);
        if (!otherProfile) {
          setUnknownAccount(true);
          return;
        }
        const nextPets = mapMyPets(petsRes.data, NO_PROFILE_SRC);
        setViewingOwn(false);
        setProfile(otherProfile);
        setBio(otherProfile.bio);
        setSavedBio(otherProfile.bio);
        setApiPets(nextPets);
        setSelectedPetId((current) =>
          nextPets.some((pet) => pet.id === current) ? current : (nextPets[0]?.id ?? ''),
        );
        setApiFeedPosts(
          mapFeedGrid(feedsRes.data, (id) => `${basePath}/posts/${id}`),
        );
        setProfileReady(true);
        setFeedsReady(true);
        setSavedReady(true);
        setTaggedReady(true);
      } catch (err) {
        console.error('[myultary] profile load failed', err);
        if (!cancelled) {
          setProfileReady(true);
          setFeedsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [basePath, expectsOwn, nickname]);

  useEffect(() => {
    if (!viewingOwn || contentTab !== 'saved' || savedReady) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.savedFeeds, {
          limit: 21,
        });
        if (cancelled) return;
        setSavedApiPosts(mapFeedGrid(res.data, (id) => `${basePath}/saved/${id}`));
      } catch (err) {
        console.error('[myultary] saved feeds failed', err);
        if (!cancelled) setSavedApiPosts([]);
      } finally {
        if (!cancelled) setSavedReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [basePath, contentTab, savedReady, viewingOwn]);

  useEffect(() => {
    if (!viewingOwn || contentTab !== 'tagged' || taggedReady) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.taggedFeeds, {
          limit: 21,
        });
        if (cancelled) return;
        setTaggedPosts(mapFeedGrid(res.data, (id) => `${basePath}/tagged/${id}`));
      } catch (err) {
        console.error('[myultary] tagged feeds failed', err);
        if (!cancelled) setTaggedPosts([]);
      } finally {
        if (!cancelled) setTaggedReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [basePath, contentTab, taggedReady, viewingOwn]);

  const openCreateMenu = () => {
    openModal({
      variant: 'action',
      items: [
        {
          label: '스토리 업',
          onClick: () => {
            storyFileInputRef.current?.click();
          },
        },
        {
          label: '게시글 작성',
          onClick: () => {
            writeFileInputRef.current?.click();
          },
        },
      ],
    });
  };

  const handleWriteFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 9);
    e.target.value = '';
    if (files.length === 0) return;

    try {
      clearWriteDraft();
      const items = await Promise.all(
        files.map(async (file, i) => {
          const isVideo = file.type.startsWith('video/');
          const sourceUrl = isVideo
            ? URL.createObjectURL(file)
            : await readFileAsDataUrl(file);
          return {
            id: `media-${Date.now()}-${i}`,
            kind: (isVideo ? 'video' : 'image') as 'image' | 'video',
            fileName: file.name,
            mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
            sourceUrl,
          };
        }),
      );
      setWriteItems(items);
      router.push(`${basePath}/write/crop`);
    } catch (err) {
      console.error('[write] file read failed', err);
    }
  };

  const handleStoryFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
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
      console.error('[story-up] file read failed', err);
    }
  };

  useLayoutEffect(() => {
    const saved = readUltaryGridScroll(nickname);
    if (!saved) return;
    pendingGridScrollY.current = saved.scrollY;
    setContentTab(saved.tab);
  }, [nickname]);

  const rememberGridScroll = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest('a');
    if (!link) return;
    saveUltaryGridScroll(nickname, contentTab);
  };

  const feedPosts = useMemo(() => {
    if (expectsOwn) return apiFeedPosts;
    return MOCK_MY_FEEDS.map((feed) => ({
      id: feed.id,
      imageUrl: feed.images[0] ?? '/images/mock/post.jpg',
      isMulti: feed.images.length > 1,
      href: `${basePath}/posts/${feed.id}`,
    }));
  }, [apiFeedPosts, basePath, expectsOwn]);

  const savedPosts = useMemo(() => {
    if (expectsOwn) return savedApiPosts;
    return MOCK_SAVED_FEEDS.map((feed) => ({
      id: feed.id,
      imageUrl: feed.images[0] ?? '/images/mock/post.jpg',
      isMulti: feed.images.length > 1,
      href: `${basePath}/saved/${feed.id}`,
    }));
  }, [basePath, expectsOwn, savedApiPosts]);

  const posts =
    contentTab === 'saved' ? savedPosts : contentTab === 'tagged' ? taggedPosts : feedPosts;
  const gridReady =
    contentTab === 'saved'
      ? savedReady
      : contentTab === 'tagged'
        ? taggedReady
        : !expectsOwn || feedsReady;
  const showEmptyGrid = gridReady && posts.length === 0;

  useEffect(() => {
    const y = pendingGridScrollY.current;
    if (y == null || !profileReady || !gridReady) return;
    pendingGridScrollY.current = null;
    clearUltaryGridScroll(nickname);
    const apply = () => window.scrollTo(0, y);
    apply();
    const frame = window.requestAnimationFrame(apply);
    const timer = window.setTimeout(apply, 80);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [gridReady, nickname, profileReady, posts.length]);

  if (unknownAccount) notFound();
  if (!expectsOwn && !mockAccount) notFound();

  const handlePetSelect = (petId: string) => {
    if (pets.length <= 1) return;
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

  const openPetPhotoPicker = (petId: string) => {
    setPhotoTargetPetId(petId);
    petPhotoInputRef.current?.click();
  };

  const handlePetPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const petId = photoTargetPetId;
    e.target.value = '';
    if (!file || !petId) return;
    if (!file.type.startsWith('image/')) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPendingPetPhoto({
        petId,
        dataUrl,
        fileName: file.name,
        mimeType: file.type,
      });
      router.push(`${basePath}/pets/${petId}/photo`);
    } catch (err) {
      console.error('[pet-photo] file read failed', err);
    }
  };

  return (
    <div className={styles.shell}>
      <LogoHeader
        actions={
          isOwnAccount ? (
            <>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="글쓰기"
                onClick={openCreateMenu}
              >
                <Image src={AddIcon} alt="" width={32} height={32} />
              </button>
              <Link href="/settings" className={styles.iconBtn} aria-label="설정">
                <Image src={SettingIcon} alt="" width={32} height={32} />
              </Link>
            </>
          ) : undefined
        }
      />

      <section className={styles.profileSection} aria-label="프로필">
        <div className={styles.profileMain}>
          <h1 className={styles.nickname}>{displayNickname}</h1>

          <ul className={styles.stats}>
            <li className={styles.statItem}>
              <strong>게시물</strong>
              {postCount}
            </li>
            <li className={styles.statItem}>
              <strong>주민</strong>
              {residentCount}
            </li>
            <li className={styles.statItem}>
              <strong>이웃</strong>
              {neighborCount}
            </li>
          </ul>

          <div className={clsx(styles.bioRow, editingBio && styles.bioRowEditing)}>
            {editingBio ? (
              <>
                <input
                  ref={bioInputRef}
                  className={styles.bioInput}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      finishEditBio();
                    }
                  }}
                  aria-label="소개글"
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="소개글 수정 완료"
                  onClick={finishEditBio}
                >
                  <Check size={18} strokeWidth={2.5} aria-hidden />
                </button>
              </>
            ) : (
              <p className={styles.bio}>
                {bio}
                {isOwnAccount && profileReady ? (
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label="소개글 수정"
                    onClick={() => setEditingBio(true)}
                  >
                    <Image src={EditIcon} alt="" width={18} height={18} />
                  </button>
                ) : null}
              </p>
            )}
          </div>

          {birthdayPet ? (
            <p className={styles.birthdayRow}>
              <span>🎂오늘 생일을 맞이한 {birthdayPet.name}를 축하해주세요.</span>
            </p>
          ) : null}

          <div className={clsx(styles.petArea, activePetView === 'detail' && styles.petAreaDetail)}>
            {pets.length === 0 ? (
              profileReady ? (
              <div className={styles.petEmpty} role="status">
                <p className={styles.petEmptyText}>등록된 펫이 없습니다.</p>
              </div>
              ) : null
            ) : (
            <>
            {singlePet ? null : (
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
                {pets.map((pet) => (
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
                        <MediaImage
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
            )}

            {selectedPet ? (
              <div className={styles.petDetailCard} aria-hidden={activePetView !== 'detail'}>
                <div className={styles.petDetailPhotoWrap}>
                  <Profile imageUrl={selectedPet.imageUrl} size={88} />
                  {isOwnAccount ? (
                    <button
                      type="button"
                      className={styles.petSettingBtn}
                      aria-label={`${selectedPet.name} 프로필 사진 설정`}
                      tabIndex={activePetView === 'detail' ? 0 : -1}
                      onClick={() => openPetPhotoPicker(selectedPet.id)}
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
                    {selectedPet.name}
                    {selectedPet.gender ? `(${selectedPet.gender})` : ''}
                  </p>
                  <p className={styles.petHandle}>{selectedPet.handle}</p>
                  <p className={styles.petBio}>{selectedPet.bio}</p>
                </div>
              </div>
            ) : null}
            </>
            )}
          </div>
        </div>

        <nav className={styles.sideTabs} aria-label="콘텐츠 메뉴">
          {profile?.userNo != null ? (
            <Link
              href={`/stories?${new URLSearchParams({
                userNo: String(profile.userNo),
                nickname: profile.nickname,
                single: '1',
              }).toString()}`}
              className={clsx(styles.sideTabBtn, getStoryTabClass(storyStatus))}
              aria-label="스토리"
            >
              <Image src={getStoryIcon(storyStatus)} alt="" width={20} height={20} />
            </Link>
          ) : (
            <span
              className={clsx(styles.sideTabBtn, getStoryTabClass(storyStatus))}
              aria-label="스토리"
            >
              <Image src={getStoryIcon(storyStatus)} alt="" width={20} height={20} />
            </span>
          )}

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

          <button
            type="button"
            className={clsx(
              styles.sideTabBtn,
              contentTab === 'tagged' ? styles.sideTabActive : undefined,
            )}
            onClick={() => setContentTab('tagged')}
            aria-label="태그됨"
            aria-pressed={contentTab === 'tagged'}
          >
            <Image
              src={contentTab === 'tagged' ? GroupOnIcon : GroupOffIcon}
              alt=""
              width={20}
              height={20}
            />
          </button>
        </nav>
      </section>

      <section
        className={styles.feedSection}
        aria-label="게시물 그리드"
        onClick={rememberGridScroll}
      >
        {showEmptyGrid ? (
          <p className={styles.feedEmpty} role="status">
            게시글이 없습니다
          </p>
        ) : gridReady ? (
          <FeedGrid posts={posts} />
        ) : null}
      </section>

      {isOwnAccount ? (
        <input
          ref={petPhotoInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenFileInput}
          onChange={handlePetPhotoChange}
        />
      ) : null}
      <input
        ref={writeFileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className={styles.hiddenFileInput}
        onChange={(e) => void handleWriteFilesChange(e)}
      />
      <input
        ref={storyFileInputRef}
        type="file"
        accept="image/*,video/*"
        className={styles.hiddenFileInput}
        onChange={(e) => void handleStoryFileChange(e)}
      />

      <FooterMenu />
    </div>
  );
}
