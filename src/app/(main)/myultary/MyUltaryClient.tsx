'use client';
import { LinkedUltaries } from '@/components/my-ultary/LinkedUltaries';
import { selectGridPet, selectGridTab, type ContentTab } from '@/lib/myultary/petFeedSelection';
import { nicknameTag } from '@/lib/nickname-tag';
import { useResettableState } from '@/lib/react/useResettableState';
import { useHydrated } from '@/lib/react/useHydrated';

import type { PublicUltaryView } from '@/types/public-ultary';
import { ultaryTitle } from '@/lib/myultary/title';
import reloadStyles from '@/components/common/PageLoadError.module.scss';
import { PageLoadError } from '@/components/common/PageLoadError';

import { FooterMenu } from '@/components/common/FooterMenu';
import { LogoHeader } from '@/components/common/LogoHeader';
import { LogoLoading } from '@/components/common/LogoLoading';
import { FeedGrid, type FeedGridItem } from '@/components/feed/FeedGrid';
import { Profile } from '@/components/my-ultary/Profile';
import { bffEndpoints } from '@/lib/api/endpoints';
import { bffDelete, bffGet, bffPatchJson, bffPostJson } from '@/lib/api/bffFetch';
import { isHttpError, isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
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
import { showFooterNotice } from '@/lib/ui/footerNotice';
import { readFileAsDataUrl, setPendingPetPhoto } from '@/lib/pending-pet-photo';
import {
  clearUltaryGridScroll,
  readUltaryGridScroll,
  saveUltaryGridScroll,
} from '@/lib/myultary/gridScroll';
import {
  cancelReport,
  canCancelReport,
  openReportModal,
  type MyReport,
} from '@/lib/report/openReport';
import { useWriteDraftStore } from '@/stores/write-draft.store';
import { useStoryDraftStore } from '@/stores/story-draft.store';
import { useModalStore } from '@/stores/modal.store';
import clsx from 'clsx';
import { Ban, Check, Ellipsis, Flag, Settings } from 'lucide-react';
import { MediaImage } from '@/components/common/MediaImage';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/free-mode';
import { FreeMode } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './myultary.module.scss';

const AddIcon = '/images/icon/Add_round.svg';
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

type Pet = MyUltaryPetCard;

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
  guestData?: PublicUltaryView;
};

/** 마이울타리 (/myultary/[nickname]) — 내 계정·다른 사람 모두 실제 API 사용 */
export default function MyUltaryClient({ nickname, guestData }: MyUltaryClientProps) {
  const guest = guestData != null;
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
  const router = useRouter();
  const basePath = myUltaryPath(nickname);

  const petSwiperRef = useRef<SwiperType | null>(null);
  const petPhotoInputRef = useRef<HTMLInputElement>(null);
  const [canPetPrev, setCanPetPrev] = useState(false);
  const [canPetNext, setCanPetNext] = useState(false);
  const [petViewMode, setPetViewMode] = useResettableState<'carousel' | 'detail'>('carousel', [
    nickname,
  ]);
  const [selectedPetId, setSelectedPetId] = useResettableState('', [nickname]);
  const hydrated = useHydrated();
  const [restoredScroll] = useResettableState(
    () => (hydrated ? readUltaryGridScroll(nickname) : null),
    [nickname, hydrated],
  );
  const [contentTab, setContentTab] = useResettableState<ContentTab>(
    restoredScroll?.tab ?? 'feed',
    [nickname, hydrated],
  );
  const pendingGridScrollY = useRef<number | null>(null);
  const [photoTargetPetId, setPhotoTargetPetId] = useState<string | null>(null);
  const [profileReload, setProfileReload] = useState(0);
  const [profile, setProfile] = useState<MyUltaryProfile | null>(guestData?.profile ?? null);
  const [viewingOwn, setViewingOwn] = useState(false);
  const [profileReady, setProfileReady] = useResettableState(
    guest,
    [basePath, nickname, guest, profileReload],
    !guest,
  );
  const [unknownAccount, setUnknownAccount] = useState(false);
  const [apiPets, setApiPets] = useState<Pet[]>(guestData?.pets ?? []);
  const [apiFeedPosts, setApiFeedPosts] = useState<FeedGridItem[]>(guestData?.feeds ?? []);
  const [pinnedPosts, setPinnedPosts] = useResettableState<FeedGridItem[]>(
    guestData?.pinned ?? [],
    [basePath, nickname, guest, profileReload],
    !guest,
  );
  const [taggedPosts, setTaggedPosts] = useResettableState<FeedGridItem[]>(
    guestData?.tagged ?? [],
    [basePath, nickname, guest, profileReload],
    !guest,
  );
  const [feedsReady, setFeedsReady] = useResettableState(
    guest,
    [basePath, nickname, guest, profileReload],
    !guest,
  );
  const [pinnedReady, setPinnedReady] = useResettableState(
    guest,
    [basePath, nickname, guest, profileReload],
    !guest,
  );
  const [taggedReady, setTaggedReady] = useResettableState(
    guest,
    [basePath, nickname, guest, profileReload],
    !guest,
  );
  const [bio, setBio] = useState(() => guestData?.profile.bio ?? '');
  const [savedBio, setSavedBio] = useState(() => guestData?.profile.bio ?? '');
  const [editingBio, setEditingBio] = useState(false);
  const bioInputRef = useRef<HTMLInputElement>(null);

  const openModal = useModalStore((s) => s.open);
  const [petMenu, setPetMenu] = useResettableState<DOMRect | null>(
    null,
    [viewingOwn, unknownAccount],
    viewingOwn && !unknownAccount,
  );
  const [petMenuPlace, setPetMenuPlace] = useState<{ top: number; left: number } | null>(null);
  const [accountReport, setAccountReport] = useResettableState<MyReport | null>(
    profile?.myReport ?? null,
    [profile?.userNo, profile?.myReport],
  );
  const [blockingAccount, setBlockingAccount] = useState(false);

  const [relationBusy, setRelationBusy] = useState(false);
  const petMenuRef = useRef<HTMLDivElement>(null);
  const setWriteItems = useWriteDraftStore((s) => s.setItems);
  const clearWriteDraft = useWriteDraftStore((s) => s.clear);
  const setStoryMedia = useStoryDraftStore((s) => s.setMedia);
  const clearStoryDraft = useStoryDraftStore((s) => s.clear);
  const writeFileInputRef = useRef<HTMLInputElement>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  const pets = apiPets;
  const activePetView = petViewMode;
  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0];
  const birthdayPet = pets.find((pet) => pet.isBirthday);
  const showPetNav = pets.length > 4;
  const isOwnAccount = viewingOwn && !unknownAccount;
  const storyStatus: AccountStoryStatus = profile ? storyRingStatus(profile) : 'none';
  const displayNickname = profile?.nickname ?? nickname;
  const postCount = profile?.feedCount ?? 0;
  const followCount = profile?.followCount ?? 0;
  const followerCount = profile?.followerCount ?? 0;

  useEffect(() => {
    if (!profileReady) return;
    document.title = ultaryTitle(
      displayNickname,
      pets.map((pet) => pet.handle),
    );
  }, [profileReady, displayNickname, pets]);

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
    if (!viewingOwn || guest || next === savedBio) return;
    void (async () => {
      try {
        await bffPatchJson<BffEnvelope<unknown>, { bio: string }>(bffEndpoints.myUltary.bio, {
          bio: next,
        });
        setSavedBio(next);
        setProfile((prev) => (prev ? { ...prev, bio: next } : prev));
      } catch (err) {
        console.error('[myultary] bio update failed', err);
        setBio(savedBio);
      }
    })();
  };

  useEffect(() => {
    if (guest) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.profile);
        const nextProfile = mapMyUltaryProfile(res.data);
        if (cancelled) return;
        const isMine = nextProfile != null && nickname === nextProfile.nickname;
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
            nextPets.some((pet) => pet.id === current) ? current : '',
          );
          setApiFeedPosts(mapFeedGrid(feedsRes.data, (id) => `${basePath}/posts/${id}`));
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
          setProfileReady(true);
          setFeedsReady(true);
          return;
        }
        const otherUserNo = matched.userNo;
        const otherRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.ultary, {
          userNo: otherUserNo,
        });
        const otherProfile = mapMyUltaryProfile(otherRes.data);
        if (cancelled) return;
        if (otherProfile?.relationStatus === 'BLOCKED') {
          setViewingOwn(false);
          setProfile(otherProfile);
          setBio(otherProfile.bio);
          setSavedBio(otherProfile.bio);
          setApiPets([]);
          setApiFeedPosts([]);
          setProfileReady(true);
          setFeedsReady(true);
          return;
        }
        const [petsRes, feedsRes] = await Promise.all([
          bffGet<BffEnvelope<unknown>>(bffEndpoints.users.pets, { userNo: otherUserNo }),
          bffGet<BffEnvelope<unknown>>(bffEndpoints.users.feeds, {
            userNo: otherUserNo,
            size: 21,
          }),
        ]);
        if (cancelled) return;
        if (!otherProfile) {
          setUnknownAccount(true);
          setProfileReady(true);
          setFeedsReady(true);
          return;
        }
        const nextPets = mapMyPets(petsRes.data, NO_PROFILE_SRC);
        setViewingOwn(false);
        setProfile(otherProfile);
        setBio(otherProfile.bio);
        setSavedBio(otherProfile.bio);
        setApiPets(nextPets);
        setSelectedPetId((current) => (nextPets.some((pet) => pet.id === current) ? current : ''));
        setApiFeedPosts(mapFeedGrid(feedsRes.data, (id) => `${basePath}/posts/${id}`));
        setProfileReady(true);
        setFeedsReady(true);
      } catch (err) {
        console.error('[myultary] profile load failed', err);
        if (!cancelled) setLoadFailed({ error: err });
        if (!cancelled) {
          setProfileReady(true);
          setFeedsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [basePath, nickname, guest, profileReload, setProfileReady, setFeedsReady, setSelectedPetId]);

  useEffect(() => {
    if (
      guest ||
      profile?.relationStatus === 'BLOCKED' ||
      !profileReady ||
      contentTab !== 'pinned' ||
      pinnedReady
    )
      return;
    const ownerUserNo = profile?.userNo;
    if (!viewingOwn && ownerUserNo == null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = viewingOwn
          ? await bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.pinnedFeeds, {
              limit: 21,
            })
          : await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.pinnedFeeds, {
              userNo: ownerUserNo,
              limit: 21,
            });
        if (cancelled) return;
        setPinnedPosts(mapFeedGrid(res.data, (id) => `${basePath}/pinned/${id}`));
      } catch (err) {
        console.error('[myultary] pinned feeds failed', err);
        if (!cancelled) setLoadFailed({ error: err });
        if (!cancelled) setPinnedPosts([]);
      } finally {
        if (!cancelled) setPinnedReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    basePath,
    contentTab,
    pinnedReady,
    profile?.userNo,
    profile?.relationStatus,
    profileReady,
    viewingOwn,
    guest,
    setPinnedPosts,
    setPinnedReady,
  ]);

  useEffect(() => {
    if (
      guest ||
      profile?.relationStatus === 'BLOCKED' ||
      !profileReady ||
      contentTab !== 'tagged' ||
      taggedReady
    )
      return;
    const ownerUserNo = profile?.userNo;
    if (!viewingOwn && ownerUserNo == null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = viewingOwn
          ? await bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.taggedFeeds, {
              limit: 21,
            })
          : await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.taggedFeeds, {
              userNo: ownerUserNo,
              limit: 21,
            });
        if (cancelled) return;
        setTaggedPosts(mapFeedGrid(res.data, (id) => `${basePath}/tagged/${id}`));
      } catch (err) {
        console.error('[myultary] tagged feeds failed', err);
        if (!cancelled) setLoadFailed({ error: err });
        if (!cancelled) setTaggedPosts([]);
      } finally {
        if (!cancelled) setTaggedReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    basePath,
    contentTab,
    profile?.userNo,
    profile?.relationStatus,
    profileReady,
    taggedReady,
    viewingOwn,
    guest,
    setTaggedPosts,
    setTaggedReady,
  ]);

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
          const sourceUrl = isVideo ? URL.createObjectURL(file) : await readFileAsDataUrl(file);
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
    const saved = restoredScroll;
    if (!saved) return;
    pendingGridScrollY.current = saved.scrollY;
  }, [restoredScroll]);

  const blockedByMe = !guest && !isOwnAccount && profile?.relationStatus === 'BLOCKED';
  const showRelationActions =
    !guest && !blockedByMe && profileReady && !isOwnAccount && profile?.userNo != null;

  const toggleFollow = async () => {
    if (!profile?.userNo || relationBusy || isOwnAccount) return;
    const label = followButtonLabel(profile);
    setRelationBusy(true);
    try {
      if (label === '팔로우 끊기' || label === '팔로우 요청취소') {
        if (profile.neighborId == null) throw new Error('neighbor missing');
        await bffDelete(bffEndpoints.users.neighborCancel, { neighborId: profile.neighborId });
        setProfile((prev) => {
          if (!prev) return prev;
          if (label === '팔로우 요청취소') {
            return { ...prev, following: false, relationStatus: 'NONE', neighborId: null };
          }
          const stillFollowed = prev.followedBy;
          return {
            ...prev,
            following: false,
            relationStatus: stillFollowed ? 'ACCEPTED' : 'NONE',
            neighborId: stillFollowed ? prev.neighborId : null,
            followerCount: Math.max(0, prev.followerCount - 1),
          };
        });
        if (label === '팔로우 요청취소') showFooterNotice('팔로우 요청을 취소했습니다.');
        return;
      }
      const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.users.neighborRequest, {
        userNo: profile.userNo,
      });
      const created = readFollowResult(res.data);
      if (!created.accepted) {
        showFooterNotice('팔로우 요청을 보냈습니다.');
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                following: false,
                relationStatus: 'PENDING_SENT',
                neighborId: created.neighborId ?? prev.neighborId,
              }
            : prev,
        );
        return;
      }
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              following: true,
              relationStatus: 'ACCEPTED',
              neighborId: created.neighborId ?? prev.neighborId,
              followerCount: prev.followerCount + 1,
            }
          : prev,
      );
    } catch (err) {
      console.error('[myultary] follow toggle failed', err);
      showFooterNotice(relationErrorMessage(err, profile.following, followErrorFallback(label)));
    } finally {
      setRelationBusy(false);
    }
  };

  const openMessage = async () => {
    if (!profile?.userNo || relationBusy || isOwnAccount) return;
    setRelationBusy(true);
    try {
      const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.rooms, {
        targetUserNo: profile.userNo,
      });
      const raw = isRecord(res.data) ? res.data : null;
      const roomValue = raw?.dmRoomId ?? raw?.roomId;
      const roomId = typeof roomValue === 'number' ? String(roomValue) : roomValue;
      if (typeof roomId !== 'string' || !roomId.trim()) throw new Error('room missing');
      router.push(`/dm/${roomId}`);
    } catch (err) {
      console.error('[myultary] message failed', err);
      showFooterNotice(relationErrorMessage(err, false, '대화를 시작하지 못했습니다.'));
    } finally {
      setRelationBusy(false);
    }
  };

  const rememberGridScroll = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest('a');
    if (!link) return;
    saveUltaryGridScroll(nickname, contentTab);
  };

  const feedPosts = apiFeedPosts;
  const pinnedGrid = pinnedPosts;

  const selectedGridPet =
    contentTab !== 'pinned' && pets.some((pet) => pet.id === selectedPetId) ? selectedPetId : '';
  const petGridKey = selectedGridPet
    ? `${profile?.userNo}:${contentTab}:${selectedGridPet}:${profileReload}`
    : '';
  const [petGrid, setPetGrid] = useState<{
    key: string;
    posts: FeedGridItem[];
    error?: { value: unknown };
  } | null>(null);
  useEffect(() => {
    if (!petGridKey || !profile?.userNo) return;
    let cancelled = false;
    bffGet<BffEnvelope<unknown>>(bffEndpoints.users.petFeeds, {
      userNo: profile.userNo,
      petId: selectedGridPet,
      tab: contentTab,
      limit: 50,
    })
      .then((response) => {
        if (!cancelled)
          setPetGrid({
            key: petGridKey,
            posts: mapFeedGrid(response.data, (id) =>
              guest
                ? `/feeds/${id}`
                : `${basePath}/${contentTab === 'tagged' ? 'tagged' : 'posts'}/${id}`,
            ),
          });
      })
      .catch((error) => {
        if (!cancelled) setPetGrid({ key: petGridKey, posts: [], error: { value: error } });
      });
    return () => {
      cancelled = true;
    };
  }, [petGridKey, profile?.userNo, selectedGridPet, contentTab, guest, basePath]);
  const petGridResult = petGrid?.key === petGridKey ? petGrid : null;
  const posts = selectedGridPet
    ? (petGridResult?.posts ?? [])
    : contentTab === 'pinned'
      ? pinnedGrid
      : contentTab === 'tagged'
        ? taggedPosts
        : feedPosts;
  const gridReady = selectedGridPet
    ? petGridResult !== null
    : contentTab === 'pinned'
      ? pinnedReady
      : contentTab === 'tagged'
        ? taggedReady
        : feedsReady;
  const showEmptyGrid = gridReady && posts.length === 0;
  const postsLocked =
    blockedByMe || (!viewingOwn && profile?.privateAccount === true && profile.following !== true);

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

  useLayoutEffect(() => {
    if (!petMenu) return;
    const el = petMenuRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const pad = 8;
    const gap = 6;
    let left = petMenu.right - box.width;
    if (left < pad) left = pad;
    if (left + box.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - pad - box.width);
    }
    let top = petMenu.bottom + gap;
    if (top + box.height > window.innerHeight - pad) {
      top = petMenu.top - box.height - gap;
    }
    setPetMenuPlace({ top: Math.max(pad, top), left });
  }, [petMenu]);

  useEffect(() => {
    if (!petMenu) return;
    const close = () => setPetMenu(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [petMenu, setPetMenu]);

  const askReportAccount = useCallback(() => {
    const userNo = profile?.userNo;
    setPetMenu(null);
    if (canCancelReport(accountReport)) {
      void cancelReport(accountReport.reportId)
        .then(() => setAccountReport(null))
        .catch(() => undefined);
      return;
    }
    if (userNo == null) {
      openModal({
        variant: 'alert',
        title: '알림창',
        content: '신고를 접수하지 못했습니다.',
        showCloseButton: true,
      });
      return;
    }
    openReportModal({ targetType: 'USER', targetId: userNo }, setAccountReport);
  }, [accountReport, openModal, profile?.userNo, setAccountReport, setPetMenu]);

  const toggleAccountBlock = async () => {
    const userNo = profile?.userNo;
    if (guest || isOwnAccount || userNo == null || blockingAccount) return;
    setBlockingAccount(true);
    const showBlockedProfile = () => {
      setProfile((current) =>
        current
          ? {
              ...current,
              relationStatus: 'BLOCKED',
              following: false,
              followedBy: false,
              neighborId: null,
              followerCount: Math.max(0, current.followerCount - (current.following ? 1 : 0)),
              followCount: Math.max(0, current.followCount - (current.followedBy ? 1 : 0)),
            }
          : current,
      );
      setApiPets([]);
      setApiFeedPosts([]);
      setPinnedPosts([]);
      setTaggedPosts([]);
      setPetMenu(null);
    };
    try {
      if (blockedByMe) {
        await bffDelete<BffEnvelope<unknown>>(bffEndpoints.users.unblock, { userNo });
        setPetMenu(null);
        setProfileReload((value) => value + 1);
        return;
      }
      await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.users.block, { userNo });
      showBlockedProfile();
    } catch (error) {
      setPetMenu(null);
      const code = isHttpError(error) && isRecord(error.data) ? error.data.code : '';
      if (blockedByMe && code === 'USER_NOT_BLOCKED') {
        setProfileReload((value) => value + 1);
      } else if (!blockedByMe && code === 'USER_ALREADY_BLOCKED') {
        showBlockedProfile();
      } else {
        openModal({
          variant: 'alert',
          title: '알림창',
          content: relationErrorMessage(
            error,
            false,
            blockedByMe
              ? '차단을 해제하지 못했습니다. 잠시 후 다시 시도해 주세요.'
              : '사용자를 차단하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          ),
          showCloseButton: true,
        });
      }
    } finally {
      setBlockingAccount(false);
    }
  };

  if (unknownAccount) notFound();

  if (!profileReady || !feedsReady) {
    return <LogoLoading />;
  }

  const changeContentTab = (tab: ContentTab) => {
    const next = selectGridTab({ tab: contentTab, petId: selectedPetId }, tab);
    if (next.tab === contentTab) return;
    setSelectedPetId(next.petId);
    setPetViewMode('carousel');
    setContentTab(next.tab);
  };
  const handlePetSelect = (petId: string) => {
    const next = selectGridPet({ tab: contentTab, petId: selectedPetId }, petId);
    setContentTab(next.tab);
    setSelectedPetId(next.petId);
    setPetViewMode(next.petId ? 'detail' : 'carousel');

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

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

  return (
    <div className={styles.shell}>
      <LogoHeader
        hideOnDesktop={!guest && !isOwnAccount}
        actions={
          guest ? (
            <Link href="/login" className={clsx(reloadStyles.reload, styles.guestLogin)}>
              로그인
            </Link>
          ) : isOwnAccount ? (
            <>
              <button
                type="button"
                className={clsx(styles.iconBtn, styles.headerIconBtn)}
                aria-label="만들기"
                onClick={openCreateMenu}
              >
                <Image src={AddIcon} alt="" width={28} height={28} />
              </button>
              <Link
                href="/settings"
                className={clsx(styles.iconBtn, styles.headerIconBtn)}
                aria-label="설정"
              >
                <Settings size={28} strokeWidth={1.75} aria-hidden />
              </Link>
            </>
          ) : undefined
        }
      />

      <section className={styles.profileSection} aria-label="프로필">
        <div className={styles.profileMain}>
          <div className={styles.nicknameRow}>
            <h1 className={styles.nickname}>{nicknameTag(displayNickname)}</h1>
            {!guest && !isOwnAccount ? (
              <button
                type="button"
                className={styles.nickMoreBtn}
                aria-label="더보기"
                aria-expanded={petMenu != null}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setPetMenuPlace(null);
                  setPetMenu((open) => (open ? null : rect));
                }}
              >
                <Ellipsis size={14} strokeWidth={2} />
              </button>
            ) : null}
          </div>

          <ul className={styles.stats}>
            <li className={styles.statItem}>
              <button
                type="button"
                className={styles.statBtn}
                disabled={blockedByMe}
                onClick={() => changeContentTab('feed')}
              >
                <strong>게시물</strong>
                {postCount}
              </button>
            </li>
            <li className={styles.statItem}>
              {!guest && profile?.userNo != null && !postsLocked ? (
                <Link
                  href={`${myUltaryPath(profile.nickname)}/neighbors?userNo=${profile.userNo}`}
                  className={styles.statLink}
                >
                  <strong>팔로워</strong>
                  {followerCount}
                </Link>
              ) : (
                <>
                  <strong>팔로워</strong>
                  {followerCount}
                </>
              )}
            </li>
            <li className={styles.statItem}>
              {!guest && profile?.userNo != null && !postsLocked ? (
                <Link
                  href={`${myUltaryPath(profile.nickname)}/residents?userNo=${profile.userNo}`}
                  className={styles.statLink}
                >
                  <strong>팔로우</strong>
                  {followCount}
                </Link>
              ) : (
                <>
                  <strong>팔로우</strong>
                  {followCount}
                </>
              )}
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

          {!blockedByMe ? (
            <>
              {profile?.userNo ? (
                <LinkedUltaries
                  key={profile.userNo}
                  userNo={profile.userNo}
                  own={isOwnAccount && !guest}
                />
              ) : null}
              {birthdayPet ? (
                <p className={styles.birthdayRow}>
                  <span>🎂오늘 생일을 맞이한 {birthdayPet.name}를 축하해주세요.</span>
                </p>
              ) : null}

              <div
                className={clsx(styles.petArea, activePetView === 'detail' && styles.petAreaDetail)}
              >
                {pets.length === 0 ? (
                  profileReady ? (
                    <div className={styles.petEmpty} role="status">
                      <p className={styles.petEmptyText}>등록된 펫이 없습니다.</p>
                      {isOwnAccount ? (
                        <Link href="/settings/pets" className={styles.emptyAction}>
                          반려동물 관리로 가기
                        </Link>
                      ) : null}
                    </div>
                  ) : null
                ) : (
                  <>
                    {pets.length === 0 ? null : (
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
                                aria-label={`${pet.name} 피드 보기`}
                                aria-pressed={selectedPetId === pet.id && contentTab !== 'pinned'}
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
                      <div
                        className={styles.petDetailCard}
                        aria-hidden={activePetView !== 'detail'}
                      >
                        <div className={styles.petDetailPhotoWrap}>
                          <button
                            type="button"
                            className={styles.petDetailSelect}
                            onClick={() => handlePetSelect(selectedPet.id)}
                            aria-label={`${selectedPet.name} 선택 해제`}
                            tabIndex={activePetView === 'detail' ? 0 : -1}
                          >
                            <Profile imageUrl={selectedPet.imageUrl} size={88} />
                          </button>
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
                          <p className={styles.petBio}>{selectedPet.bio}</p>
                          <button
                            type="button"
                            className={styles.clearPetSelection}
                            tabIndex={activePetView === 'detail' ? 0 : -1}
                            onClick={() => handlePetSelect(selectedPet.id)}
                          >
                            전체 피드 보기
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
                {showRelationActions ? (
                  <div className={styles.relationActions}>
                    <button
                      type="button"
                      className={styles.relationBtn}
                      disabled={relationBusy}
                      onClick={() => void toggleFollow()}
                    >
                      {profile ? followButtonLabel(profile) : '팔로우'}
                    </button>
                    <button
                      type="button"
                      className={styles.relationBtn}
                      disabled={relationBusy}
                      onClick={() => void openMessage()}
                    >
                      메시지 보내기
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <p className={styles.feedEmpty} role="status">
              차단한 유저입니다.
            </p>
          )}
        </div>

        {postsLocked ? null : (
          <nav className={styles.sideTabs} aria-label="콘텐츠 메뉴">
            {profile?.userNo != null && storyStatus !== 'none' ? (
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
              onClick={() => changeContentTab('feed')}
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
                contentTab === 'tagged' ? styles.sideTabActive : undefined,
              )}
              onClick={() => changeContentTab('tagged')}
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

            <button
              type="button"
              className={clsx(
                styles.sideTabBtn,
                contentTab === 'pinned' ? styles.sideTabActive : undefined,
              )}
              onClick={() => changeContentTab('pinned')}
              aria-label="고정"
              aria-pressed={contentTab === 'pinned'}
            >
              <Image
                src={contentTab === 'pinned' ? SavedOnIcon : SavedOffIcon}
                alt=""
                width={20}
                height={20}
              />
            </button>
          </nav>
        )}
      </section>

      <section
        className={styles.feedSection}
        aria-label="게시물 그리드"
        onClick={rememberGridScroll}
      >
        {blockedByMe ? null : postsLocked ? (
          <p className={styles.feedEmpty} role="status">
            비공개 계정입니다
          </p>
        ) : selectedGridPet && petGridResult?.error ? (
          <PageLoadError error={petGridResult.error.value} />
        ) : selectedGridPet && !petGridResult ? (
          <p className={styles.feedEmpty} role="status">
            불러오는 중
          </p>
        ) : showEmptyGrid ? (
          <div className={styles.feedEmpty} role="status">
            <p className={styles.feedEmptyText}>게시글이 없습니다</p>
            {isOwnAccount && contentTab === 'feed' ? (
              <button
                type="button"
                className={styles.emptyAction}
                onClick={() => writeFileInputRef.current?.click()}
              >
                게시글 작성하기
              </button>
            ) : null}
          </div>
        ) : gridReady ? (
          <FeedGrid posts={posts} className={styles.feedGrid} />
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
      {!guest ? (
        <>
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
        </>
      ) : null}
      {!guest ? <FooterMenu /> : null}
      {petMenu
        ? createPortal(
            <>
              <button
                type="button"
                className={styles.petMenuBackdrop}
                aria-label="메뉴 닫기"
                onClick={() => setPetMenu(null)}
              />
              <div
                ref={petMenuRef}
                className={styles.petMenu}
                role="menu"
                style={
                  petMenuPlace
                    ? { top: petMenuPlace.top, left: petMenuPlace.left }
                    : { visibility: 'hidden' }
                }
              >
                <button
                  type="button"
                  className={styles.petMenuBtn}
                  role="menuitem"
                  onClick={askReportAccount}
                >
                  <span className={styles.petMenuIcon}>
                    <Flag size={22} strokeWidth={1.75} />
                  </span>
                  <span className={styles.petMenuLabel}>
                    {canCancelReport(accountReport) ? '신고취소' : '신고하기'}
                  </span>
                </button>
                {!guest && !isOwnAccount ? (
                  <button
                    type="button"
                    className={styles.petMenuBtn}
                    role="menuitem"
                    onClick={() => void toggleAccountBlock()}
                    disabled={blockingAccount || profile?.userNo == null}
                  >
                    <span className={styles.petMenuIcon}>
                      <Ban size={22} strokeWidth={1.75} />
                    </span>
                    <span className={styles.petMenuLabel}>
                      {blockingAccount
                        ? blockedByMe
                          ? '해제 중...'
                          : '차단 중...'
                        : blockedByMe
                          ? '차단해제'
                          : '차단하기'}
                    </span>
                  </button>
                ) : null}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}

function followButtonLabel(profile: MyUltaryProfile) {
  if (profile.following) return '팔로우 끊기';
  if (profile.relationStatus === 'PENDING_SENT') return '팔로우 요청취소';
  if (
    profile.privateAccount &&
    !profile.followedBy &&
    profile.relationStatus !== 'PENDING_RECEIVED'
  ) {
    return '팔로우 요청';
  }
  return '팔로우';
}

function followErrorFallback(label: string) {
  if (label === '팔로우 끊기') return '팔로우를 끊지 못했습니다.';
  if (label === '팔로우 요청취소') return '팔로우 요청을 취소하지 못했습니다.';
  return '팔로우 요청을 보내지 못했습니다.';
}

function readFollowResult(raw: unknown) {
  if (!isRecord(raw)) return { neighborId: null as number | null, accepted: false };
  return {
    neighborId: typeof raw.neighborId === 'number' ? raw.neighborId : null,
    accepted: raw.status === 'ACCEPTED',
  };
}

function relationErrorMessage(err: unknown, following: boolean, fallback?: string) {
  const code =
    isHttpError(err) && isRecord(err.data) && typeof err.data.code === 'string'
      ? err.data.code
      : '';
  if (code === 'NEIGHBOR_ALREADY_EXISTS' || code === 'NEIGHBOR_ALREADY_REQUESTED') {
    return '이미 연결된 사이입니다.';
  }
  if (code === 'NEIGHBOR_PENDING_RECEIVED') return '상대의 요청을 먼저 수락해 주세요.';
  if (code === 'NEIGHBOR_REQUEST_CLOSED') return '팔로우 신청을 받지 않는 계정입니다.';
  if (
    isHttpError(err) &&
    isRecord(err.data) &&
    typeof err.data.message === 'string' &&
    err.data.message.trim()
  ) {
    return err.data.message;
  }
  if (fallback) return fallback;
  return following ? '팔로우를 끊지 못했습니다.' : '팔로우 요청을 보내지 못했습니다.';
}
