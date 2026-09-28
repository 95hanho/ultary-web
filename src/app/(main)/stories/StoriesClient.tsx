'use client';

import { Profile } from '@/components/my-ultary/Profile';
import { StoryDevTools } from '@/components/dev/StoryDevTools';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { STORY_IMAGE_DURATION_MS } from '@/lib/mock/stories';
import type { BffEnvelope } from '@/types/api';
import type { Story, StoryOwner } from '@/types/story';
import { Ellipsis, Pause, Play, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import styles from './stories.module.scss';

type StorySlide = {
  storyId: number;
  kind: 'image' | 'video';
  src: string;
  viewedByMe: boolean;
};

type StartMode = 'unviewed' | 'last';

type Props = {
  userNo: string;
  nicknameHint?: string;
  start?: StartMode;
  /** 메인에서 안 읽은 링을 연 경우. 클릭 유저 뒤의 안 읽은 유저만 이어서 재생 */
  unreadChain?: boolean;
  /** unreadChain 시작 유저 (메인에서 누른 userNo) */
  fromUserNo?: string;
  /** 피드에서 연 경우. 이 유저 스토리만 보고 끝에서는 이전 페이지로 */
  singleUser?: boolean;
};

const FALLBACK_MEDIA = '/images/mock/post.jpg';
const FALLBACK_PROFILE = NO_PROFILE_SRC;

function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    const data = (raw as BffEnvelope<T[]>).data;
    if (Array.isArray(data)) return data;
  }
  return [];
}

/** 첫 미열람 인덱스. 전부 읽었으면 0 */
function firstUnviewedIndex(stories: { viewedByMe?: boolean }[]): number {
  const i = stories.findIndex((s) => s.viewedByMe === false);
  return i >= 0 ? i : 0;
}

function toSlide(story: Story): StorySlide {
  const src =
    resolveFileDisplayUrl(story.file) ??
    resolveFileDisplayUrl(story.thumbnailFile) ??
    FALLBACK_MEDIA;
  return {
    storyId: story.storyId,
    kind: story.mediaType === 'VIDEO' ? 'video' : 'image',
    src,
    viewedByMe: Boolean(story.viewedByMe),
  };
}

function ownerStoriesHref(
  owner: StoryOwner,
  start: StartMode,
  chain?: { fromUserNo: string },
) {
  const q = new URLSearchParams({
    userNo: String(owner.userNo),
    nickname: owner.nickname,
  });
  if (start === 'last') q.set('start', 'last');
  if (chain) {
    q.set('chain', 'unread');
    q.set('from', chain.fromUserNo);
  }
  return `/stories?${q.toString()}`;
}

/**
 * 안 읽은 체인: 클릭한 유저부터, 그 뒤 hasUnviewed 유저만.
 * 클릭 유저·현재 유저는 조회 후 hasUnviewed가 꺼져도 유지한다.
 */
function unreadChainQueue(
  list: StoryOwner[],
  fromUserNo: string,
  currentUserNo: string,
): StoryOwner[] {
  const start = list.findIndex((o) => String(o.userNo) === fromUserNo);
  const from = start >= 0 ? start : list.findIndex((o) => String(o.userNo) === currentUserNo);
  if (from < 0) return [];

  return list.filter((owner, i) => {
    if (i < from) return false;
    if (String(owner.userNo) === fromUserNo) return true;
    if (String(owner.userNo) === currentUserNo) return true;
    return owner.hasUnviewed;
  });
}

/** 스토리 보기 — owners 체인 + GET /main/stories?userNo= · 조회 시 view */
export default function StoriesClient({
  userNo,
  nicknameHint = '',
  start = 'unviewed',
  unreadChain = false,
  fromUserNo = '',
  singleUser = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StorySlide[]>([]);
  const [owners, setOwners] = useState<StoryOwner[]>([]);
  const [nickname, setNickname] = useState(nicknameHint || 'ULTARY');
  const [profileUrl, setProfileUrl] = useState(FALLBACK_PROFILE);
  const [index, setIndex] = useState(0);
  const [playId, setPlayId] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const indexRef = useRef(index);
  const pausedRef = useRef(paused);
  const ownersRef = useRef<StoryOwner[]>([]);
  const markedViewRef = useRef<Set<number>>(new Set());
  indexRef.current = index;
  pausedRef.current = paused;
  ownersRef.current = owners;

  const current = items[index] ?? null;

  const close = useCallback(() => {
    router.back();
  }, [router]);

  /** 읽음 초기화 후 이전 페이지로 — 현재 스토리 재조회(읽음) 방지 */
  const onStoryViewsCleared = useCallback(async () => {
    markedViewRef.current.clear();
    router.back();
  }, [router]);

  const chainFrom = unreadChain ? fromUserNo || userNo : '';

  const goToOwner = useCallback(
    (owner: StoryOwner, nextStart: StartMode) => {
      router.replace(
        ownerStoriesHref(
          owner,
          nextStart,
          chainFrom ? { fromUserNo: chainFrom } : undefined,
        ),
      );
    },
    [chainFrom, router],
  );

  useEffect(() => {
    if (!userNo) {
      router.replace('/');
      return;
    }

    let cancelled = false;
    markedViewRef.current.clear();
    (async () => {
      setLoading(true);
      try {
        const [storiesRes, ownersRes] = await Promise.all([
          bffGet<BffEnvelope<Story[]>>(bffEndpoints.main.stories, { userNo }),
          bffGet<BffEnvelope<StoryOwner[]>>(bffEndpoints.main.storyOwners),
        ]);
        if (cancelled) return;

        const list = unwrapList<Story>(storiesRes.data ?? storiesRes);
        const ownerList = unwrapList<StoryOwner>(ownersRes.data ?? ownersRes);
        const slides = list.map(toSlide);
        setItems(slides);
        setOwners(ownerList);

        const first = list[0];
        const nick =
          nicknameHint ||
          first?.nickname?.trim() ||
          first?.authorNickname?.trim() ||
          'ULTARY';
        setNickname(nick);
        setProfileUrl(
          resolveFileDisplayUrl(first?.authorProfileFile) ?? FALLBACK_PROFILE,
        );

        if (slides.length === 0) {
          setIndex(0);
        } else if (start === 'last') {
          setIndex(slides.length - 1);
        } else {
          setIndex(firstUnviewedIndex(slides));
        }
        setPlayId((n) => n + 1);
      } catch (err) {
        console.error('[stories] load failed', err);
        if (!cancelled) {
          setItems([]);
          setOwners([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userNo, nicknameHint, router, start]);

  /** 현재 스토리 조회 시 읽음 기록 */
  useEffect(() => {
    if (!current) return;
    const { storyId } = current;
    if (markedViewRef.current.has(storyId)) return;
    markedViewRef.current.add(storyId);

    void bffPostJson(bffEndpoints.stories.view, { storyId }).catch((err) => {
      console.error('[stories] view mark failed', err);
      markedViewRef.current.delete(storyId);
    });

    setItems((prev) =>
      prev.map((s) => (s.storyId === storyId ? { ...s, viewedByMe: true } : s)),
    );
  }, [current]);

  const clearTick = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const finishOrNext = useCallback(() => {
    if (indexRef.current < items.length - 1) {
      setPaused(false);
      setIndex((i) => i + 1);
      return;
    }

    if (singleUser) {
      close();
      return;
    }

    // 현재 이웃 마지막 → 다음 이웃 또는 나가기
    const list = ownersRef.current;
    if (chainFrom) {
      const queue = unreadChainQueue(list, chainFrom, userNo);
      const i = queue.findIndex((o) => String(o.userNo) === userNo);
      const next = i >= 0 ? queue[i + 1] : undefined;
      if (next) {
        goToOwner(next, 'unviewed');
        return;
      }
      close();
      return;
    }

    const i = list.findIndex((o) => String(o.userNo) === userNo);
    const next = i >= 0 ? list[i + 1] : undefined;
    if (next) {
      goToOwner(next, 'unviewed');
      return;
    }
    close();
  }, [chainFrom, close, goToOwner, items.length, singleUser, userNo]);

  const handlePrevTap = useCallback(() => {
    setPaused(false);
    if (indexRef.current > 0) {
      setIndex((i) => i - 1);
      return;
    }

    if (singleUser) {
      close();
      return;
    }

    // 메인에서 연 유저의 첫 장에서 뒤로 가면 이전 유저가 아니라 원래 페이지로
    if (fromUserNo && userNo === fromUserNo) {
      close();
      return;
    }

    // 현재 이웃 첫 장 → 이전 이웃(마지막 장부터) 또는 나가기
    const list = ownersRef.current;
    if (chainFrom) {
      const queue = unreadChainQueue(list, chainFrom, userNo);
      const i = queue.findIndex((o) => String(o.userNo) === userNo);
      const prev = i > 0 ? queue[i - 1] : undefined;
      if (prev) {
        goToOwner(prev, 'last');
        return;
      }
      close();
      return;
    }

    const i = list.findIndex((o) => String(o.userNo) === userNo);
    const prev = i > 0 ? list[i - 1] : undefined;
    if (prev) {
      goToOwner(prev, 'last');
      return;
    }
    close();
  }, [chainFrom, close, fromUserNo, goToOwner, singleUser, userNo]);

  useEffect(() => {
    clearTick();
    setProgress(0);
    setPaused(false);
    elapsedRef.current = 0;
    startRef.current = performance.now();

    if (!current) return;

    if (current.kind === 'image') {
      const duration = STORY_IMAGE_DURATION_MS;
      const tick = (now: number) => {
        if (pausedRef.current) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const p = Math.min(
          1,
          (elapsedRef.current + (now - startRef.current)) / duration,
        );
        setProgress(p);
        if (p >= 1) {
          finishOrNext();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => clearTick();
    }

    const video = videoRef.current;
    if (!video) return;

    const onMeta = () => {
      if (!pausedRef.current) {
        void video.play().catch(() => undefined);
      }
    };

    const onTime = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      setProgress(Math.min(1, video.currentTime / video.duration));
    };

    const onEnded = () => {
      setProgress(1);
      finishOrNext();
    };

    video.currentTime = 0;
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', onEnded);

    if (video.readyState >= 1) onMeta();

    return () => {
      clearTick();
      video.pause();
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', onEnded);
    };
  }, [current, finishOrNext, index, playId]);

  useEffect(() => {
    if (!current) return;

    if (current.kind === 'image') {
      if (paused) {
        elapsedRef.current += performance.now() - startRef.current;
        return;
      }
      startRef.current = performance.now();
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
    } else {
      void video.play().catch(() => undefined);
    }
  }, [paused, current]);

  const togglePaused = () => {
    setPaused((p) => !p);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePaused();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  const handleNextTap = () => {
    finishOrNext();
  };

  const fillScale = (i: number) => {
    if (i < index) return 1;
    if (i > index) return 0;
    return progress;
  };

  if (loading) {
    return (
      <div className={styles.shell} role="status" aria-label="스토리 불러오는 중">
        <div className={styles.inner} />
        <StoryDevTools onStoryViewsCleared={onStoryViewsCleared} />
      </div>
    );
  }

  if (!current) {
    return (
      <div className={styles.shell} role="dialog" aria-modal="true" aria-label="스토리">
        <div className={styles.inner}>
          <header className={styles.header}>
            <div className={styles.profileWrap}>
              <div className={styles.profileLeft}>
                <span className={styles.nickname}>스토리가 없습니다</span>
              </div>
              <button type="button" className={styles.iconBtn} aria-label="닫기" onClick={close}>
                <X size={28} strokeWidth={2.25} />
              </button>
            </div>
          </header>
        </div>
        <StoryDevTools onStoryViewsCleared={onStoryViewsCleared} />
      </div>
    );
  }

  return (
    <div className={styles.shell} role="dialog" aria-modal="true" aria-label="스토리">
      <div className={styles.inner}>
        <div className={styles.blurBackdrop} aria-hidden>
          {current.kind === 'video' ? (
            <video
              className={styles.blurMedia}
              src={current.src}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.src} alt="" className={styles.blurMedia} draggable={false} />
          )}
        </div>

        <header className={styles.header}>
          <div className={styles.progressWrap} aria-hidden>
            {items.map((item, i) => (
              <div key={item.storyId} className={styles.progressItem}>
                <div
                  className={styles.progressFill}
                  style={{ transform: `scaleX(${fillScale(i)})` }}
                />
              </div>
            ))}
          </div>

          <div className={styles.profileWrap}>
            <div className={styles.profileLeft}>
              <Profile imageUrl={profileUrl} size={44} story="none" />
              <span className={styles.nickname}>{nickname}</span>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="더보기"
                onClick={() => {
                  console.log('[stories] more');
                }}
              >
                <Ellipsis size={28} strokeWidth={2.25} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={paused ? '재생' : '일시정지'}
                onClick={togglePaused}
              >
                {paused ? (
                  <Play size={26} strokeWidth={2.25} fill="currentColor" />
                ) : (
                  <Pause size={26} strokeWidth={2.25} fill="currentColor" />
                )}
              </button>
              <button type="button" className={styles.iconBtn} aria-label="닫기" onClick={close}>
                <X size={28} strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </header>

        <div className={styles.stage}>
          <button
            type="button"
            className={styles.tapLeft}
            aria-label="이전 스토리"
            onClick={handlePrevTap}
          />
          <button
            type="button"
            className={styles.tapRight}
            aria-label="다음 스토리"
            onClick={handleNextTap}
          />

          <StoryMedia item={current} videoRef={videoRef} />
        </div>
      </div>

      <StoryDevTools onStoryViewsCleared={onStoryViewsCleared} />
    </div>
  );
}

function StoryMedia({
  item,
  videoRef,
}: {
  item: StorySlide;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  if (item.kind === 'video') {
    return (
      <div className={styles.mediaFrame}>
        <video
          key={item.storyId}
          ref={videoRef}
          className={styles.media}
          src={item.src}
          playsInline
          muted
          preload="auto"
        />
      </div>
    );
  }

  return (
    <div className={styles.mediaFrame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={item.storyId}
        src={item.src}
        alt=""
        className={styles.media}
        draggable={false}
      />
    </div>
  );
}
