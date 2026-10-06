'use client';

import { Profile } from '@/components/my-ultary/Profile';
import { StoryDevTools } from '@/components/dev/StoryDevTools';
import { bffDelete, bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { STORY_IMAGE_DURATION_MS } from '@/lib/mock/stories';
import type { BffEnvelope, MeResponse } from '@/types/api';
import type {
  Story,
  StoryLikeResponse,
  StoryMention,
  StoryOwner,
  StoryText,
} from '@/types/story';
import { Heart, Pause, Play, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type RefObject,
} from 'react';
import styles from './stories.module.scss';

type StorySlide = {
  storyId: number;
  userNo: number;
  kind: 'image' | 'video';
  src: string;
  viewedByMe: boolean;
  likedByMe: boolean;
  texts: StoryText[];
  mentions: StoryMention[];
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
  /** 알림에서 연 경우. 이 스토리 한 장만 재생하고 끝나면 이전 페이지로 */
  onlyStoryId?: string;
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
    userNo: story.userNo,
    kind: story.mediaType === 'VIDEO' ? 'video' : 'image',
    src,
    viewedByMe: Boolean(story.viewedByMe),
    likedByMe: story.likedByMe === true,
    texts: Array.isArray(story.texts) ? story.texts : [],
    mentions: Array.isArray(story.mentions) ? story.mentions : [],
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
function readRoomId(data: unknown) {
  if (!data || typeof data !== 'object') return null;
  const raw = data as { dmRoomId?: unknown; roomId?: unknown };
  const value = raw.dmRoomId ?? raw.roomId;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

export default function StoriesClient({
  userNo,
  nicknameHint = '',
  start = 'unviewed',
  unreadChain = false,
  fromUserNo = '',
  singleUser = false,
  onlyStoryId = '',
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
  const [meUserNo, setMeUserNo] = useState<number | null>(null);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const indexRef = useRef(index);
  const pausedRef = useRef(paused);
  const ownersRef = useRef<StoryOwner[]>([]);
  const markedViewRef = useRef<Set<number>>(new Set());
  const likeLockRef = useRef(false);
  const likeTouchedRef = useRef<Set<number>>(new Set());
  const holdForReplyRef = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);
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

  const oneStory = Boolean(onlyStoryId) || singleUser;
  const chainFrom = oneStory || !unreadChain ? '' : fromUserNo || userNo;

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
    if (!userNo && !onlyStoryId) {
      router.replace('/');
      return;
    }

    let cancelled = false;
    markedViewRef.current.clear();
    (async () => {
      setLoading(true);
      try {
        const storiesRes = userNo
          ? await bffGet<BffEnvelope<Story[]>>(bffEndpoints.main.stories, { userNo })
          : await bffGet<BffEnvelope<Story[]>>(bffEndpoints.myUltary.stories);
        const ownersRes = onlyStoryId
          ? null
          : await bffGet<BffEnvelope<StoryOwner[]>>(bffEndpoints.main.storyOwners);
        if (cancelled) return;

        const loaded = unwrapList<Story>(storiesRes.data ?? storiesRes);
        const list = onlyStoryId
          ? loaded.filter((story) => String(story.storyId) === onlyStoryId)
          : loaded;
        const ownerList = ownersRes
          ? unwrapList<StoryOwner>(ownersRes.data ?? ownersRes)
          : [];
        const slides = list.map(toSlide);
        setItems(slides);
        setOwners(ownerList);

        const first = list[0];
        const nick = onlyStoryId
          ? first?.nickname?.trim() ||
            first?.authorNickname?.trim() ||
            nicknameHint ||
            'ULTARY'
          : nicknameHint ||
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
  }, [userNo, nicknameHint, router, start, onlyStoryId]);

  useEffect(() => {
    let cancelled = false;
    void bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me)
      .then((res) => {
        const id = res.data?.userNo;
        if (!cancelled && typeof id === 'number') setMeUserNo(id);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  /** 탭·클릭으로 버튼에 포커스가 남지 않게 한다. 답장 입력만 클릭으로 커서를 둔다. */
  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;
    root
      .querySelectorAll<HTMLElement>('a, button, input, textarea, select, video, [tabindex]')
      .forEach((el) => {
        el.tabIndex = -1;
      });
  });

  const skipControlFocus = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('input, textarea')) return;
    event.preventDefault();
  };

  /** 현재 스토리 조회 시 읽음 기록 */
  useEffect(() => {
    if (!current) return;
    const { storyId } = current;
    if (markedViewRef.current.has(storyId)) return;
    markedViewRef.current.add(storyId);

    void bffPostJson<BffEnvelope<Story>>(bffEndpoints.stories.view, { storyId })
      .then((res) => {
        if (likeTouchedRef.current.has(storyId)) return;
        const liked = res.data?.likedByMe;
        if (typeof liked !== 'boolean') return;
        setItems((prev) =>
          prev.map((s) => (s.storyId === storyId ? { ...s, likedByMe: liked } : s)),
        );
      })
      .catch((err) => {
        console.error('[stories] view mark failed', err);
        markedViewRef.current.delete(storyId);
      });

    setItems((prev) =>
      prev.map((s) => (s.storyId === storyId ? { ...s, viewedByMe: true } : s)),
    );
  }, [current]);

  useEffect(() => {
    setReply('');
    setReplyError('');
  }, [current?.storyId]);

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

    if (oneStory) {
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
  }, [chainFrom, close, goToOwner, items.length, oneStory, userNo]);

  const handlePrevTap = useCallback(() => {
    setPaused(false);
    if (indexRef.current > 0) {
      setIndex((i) => i - 1);
      return;
    }

    if (oneStory) {
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
  }, [chainFrom, close, fromUserNo, goToOwner, oneStory, userNo]);

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

  const onReplyFocus = () => {
    if (!pausedRef.current) {
      holdForReplyRef.current = true;
      setPaused(true);
    }
  };

  const onReplyBlur = () => {
    if (!holdForReplyRef.current) return;
    holdForReplyRef.current = false;
    setPaused(false);
  };

  const setStoryLiked = (storyId: number, liked: boolean) => {
    setItems((prev) =>
      prev.map((s) => (s.storyId === storyId ? { ...s, likedByMe: liked } : s)),
    );
  };

  const toggleLike = async () => {
    if (!current || likeLockRef.current) return;
    const storyId = current.storyId;
    const next = !current.likedByMe;
    likeLockRef.current = true;
    likeTouchedRef.current.add(storyId);
    setStoryLiked(storyId, next);
    try {
      const res = next
        ? await bffPostJson<BffEnvelope<StoryLikeResponse>>(bffEndpoints.stories.like, {
            storyId,
          })
        : await bffDelete<BffEnvelope<StoryLikeResponse>>(bffEndpoints.stories.like, {
            storyId,
          });
      if (typeof res.data?.likedByMe === 'boolean') {
        setStoryLiked(storyId, res.data.likedByMe);
      }
    } catch (err) {
      console.error('[stories] like failed', err);
      setStoryLiked(storyId, !next);
    } finally {
      likeLockRef.current = false;
    }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    const text = reply.trim();
    const targetUserNo = current?.userNo;
    const storyId = current?.storyId;
    if (!text || targetUserNo == null || storyId == null || sendingReply) return;
    setSendingReply(true);
    setReplyError('');
    try {
      const room = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.dm.rooms, {
        targetUserNo,
      });
      const roomId = readRoomId(room.data);
      if (roomId == null) throw new Error('room missing');
      await bffPostJson(bffEndpoints.dm.messages, {
        roomId,
        body: text,
        storyId,
      });
      setReply('');
    } catch (err) {
      console.error('[stories] dm send failed', err);
      setReplyError('답장을 보내지 못했습니다');
    } finally {
      setSendingReply(false);
    }
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
        const active = document.activeElement;
        if (active instanceof HTMLElement && active !== document.body) {
          active.blur();
        }
        togglePaused();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevTap();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        finishOrNext();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, finishOrNext, handlePrevTap]);

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
      <div
        ref={shellRef}
        className={styles.shell}
        role="status"
        aria-label="스토리 불러오는 중"
        onMouseDownCapture={skipControlFocus}
      >
        <div className={styles.inner} />
        <StoryDevTools onStoryViewsCleared={onStoryViewsCleared} />
      </div>
    );
  }

  if (!current) {
    return (
      <div
        ref={shellRef}
        className={styles.shell}
        role="dialog"
        aria-modal="true"
        aria-label="스토리"
        onMouseDownCapture={skipControlFocus}
      >
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
    <div
      ref={shellRef}
      className={styles.shell}
      role="dialog"
      aria-modal="true"
      aria-label="스토리"
      onMouseDownCapture={skipControlFocus}
    >
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
            <Link
              href={myUltaryPath(nickname)}
              className={styles.profileLeft}
              aria-label={`${nickname} 울타리`}
            >
              <Profile imageUrl={profileUrl} size={44} story="none" />
              <span className={styles.nickname}>{nickname}</span>
            </Link>
            <div className={styles.actions}>
              {/* 더보기. 메뉴가 정해지면 다시 연다.
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
              */}
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
            className={styles.tapStage}
            aria-label={paused ? '재생' : '일시정지'}
            onClick={togglePaused}
          />
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

        {meUserNo == null || current.userNo !== meUserNo ? (
          <form className={styles.replyBar} onSubmit={sendReply}>
            <div className={styles.replyRow}>
              <input
                className={styles.replyField}
                value={reply}
                placeholder={`${nickname}님에게 답장하기...`}
                aria-label={`${nickname}님에게 답장하기`}
                maxLength={500}
                autoComplete="off"
                onChange={(event) => {
                  setReply(event.target.value);
                  if (replyError) setReplyError('');
                }}
                onFocus={onReplyFocus}
                onBlur={onReplyBlur}
              />
              <button
                type="button"
                className={
                  current.likedByMe
                    ? `${styles.replyIcon} ${styles.replyHeartOn}`
                    : styles.replyIcon
                }
                aria-label={current.likedByMe ? '공감 취소' : '공감'}
                aria-pressed={current.likedByMe}
                onClick={() => {
                  void toggleLike();
                }}
              >
                <Heart
                  size={28}
                  strokeWidth={2}
                  fill={current.likedByMe ? 'currentColor' : 'none'}
                />
              </button>
              <button
                type="submit"
                className={styles.replyIcon}
                aria-label="답장 보내기"
                disabled={sendingReply || reply.trim().length === 0}
              >
                <Send size={26} strokeWidth={2} />
              </button>
            </div>
            {replyError ? <p className={styles.replyError}>{replyError}</p> : null}
          </form>
        ) : null}
      </div>

      <StoryDevTools onStoryViewsCleared={onStoryViewsCleared} />
    </div>
  );
}

function mentionLabel(mention: StoryMention): string {
  const id = mention.mentionId?.trim();
  if (id) return id.startsWith('@') ? id : `@${id}`;
  const name = mention.petName?.trim();
  return name || '태그된 펫';
}

function StoryOverlay({ texts, mentions }: { texts: StoryText[]; mentions: StoryMention[] }) {
  if (texts.length === 0 && mentions.length === 0) return null;
  return (
    <div className={styles.overlay} aria-hidden>
      {mentions.map((mention, index) => (
        <span
          key={`${mention.petId}-${index}`}
          className={styles.mention}
          style={{ left: `${mention.posX}%`, top: `${mention.posY}%` }}
        >
          {mentionLabel(mention)}
        </span>
      ))}
      {texts.map((text, index) => (
        <span
          key={`${text.posX}-${text.posY}-${index}`}
          className={styles.overlayText}
          style={{
            left: `${text.posX}%`,
            top: `${text.posY}%`,
            color: text.color,
            fontSize: text.fontSize || 16,
            fontWeight: text.bold ? 700 : 400,
            textDecoration: [
              text.underline ? 'underline' : null,
              text.strikethrough ? 'line-through' : null,
            ]
              .filter(Boolean)
              .join(' ') || 'none',
          }}
        >
          {text.content}
        </span>
      ))}
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
  return (
    <div className={styles.mediaFrame}>
      {item.kind === 'video' ? (
        <video
          key={item.storyId}
          ref={videoRef}
          className={styles.media}
          src={item.src}
          playsInline
          muted
          preload="auto"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={item.storyId}
          src={item.src}
          alt=""
          className={styles.media}
          draggable={false}
        />
      )}
      <StoryOverlay texts={item.texts} mentions={item.mentions} />
    </div>
  );
}
