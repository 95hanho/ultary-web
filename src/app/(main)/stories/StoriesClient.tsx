'use client';

import { Profile } from '@/components/my-ultary/Profile';
import { MOCK_STORY_OWNER, STORY_IMAGE_DURATION_MS, type MockStoryItem } from '@/lib/mock/stories';
import { Ellipsis, Pause, Play, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import styles from './stories.module.scss';

/** 스토리 보기 (미리보기) */
export default function StoriesClient() {
  const router = useRouter();
  const owner = MOCK_STORY_OWNER;
  const items = owner.items;

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
  indexRef.current = index;
  pausedRef.current = paused;

  const current = items[index] ?? null;

  const clearTick = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const close = useCallback(() => {
    router.back();
  }, [router]);

  const finishOrNext = useCallback(() => {
    if (indexRef.current >= items.length - 1) {
      close();
      return;
    }
    setPaused(false);
    setIndex((i) => i + 1);
  }, [close, items.length]);

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
        const p = Math.min(1, (elapsedRef.current + (now - startRef.current)) / duration);
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

  const handlePrevTap = () => {
    setPaused(false);
    if (index <= 0) {
      setPlayId((n) => n + 1);
      return;
    }
    setIndex((i) => i - 1);
  };

  const handleNextTap = () => {
    finishOrNext();
  };

  const fillScale = (i: number) => {
    if (i < index) return 1;
    if (i > index) return 0;
    return progress;
  };

  if (!current) return null;

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
              <div key={item.id} className={styles.progressItem}>
                <div
                  className={styles.progressFill}
                  style={{ transform: `scaleX(${fillScale(i)})` }}
                />
              </div>
            ))}
          </div>

          <div className={styles.profileWrap}>
            <div className={styles.profileLeft}>
              <Profile imageUrl={owner.profileUrl} size={44} story="none" />
              <span className={styles.nickname}>{owner.nickname}</span>
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
    </div>
  );
}

function StoryMedia({
  item,
  videoRef,
}: {
  item: MockStoryItem;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  if (item.kind === 'video') {
    return (
      <div className={styles.mediaFrame}>
        <video
          key={item.id}
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
      <img key={item.id} src={item.src} alt="" className={styles.media} draggable={false} />
    </div>
  );
}
