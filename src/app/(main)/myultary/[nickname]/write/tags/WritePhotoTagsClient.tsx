'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { PhotoTagAccountSearch } from '@/components/search/PhotoTagAccountSearch';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { useWriteDraftStore, type WritePhotoPetTag } from '@/stores/write-draft.store';
import { GripVertical, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import styles from './tags.module.scss';

/** 게시글 작성 — 사진 태그 (크롭 결과 위에 펫언급 배치) */
export default function WritePhotoTagsClient() {
  const router = useRouter();
  const params = useParams<{ nickname: string }>();
  const nickname = typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];
  const basePath = myUltaryPath(nickname);
  const editingFeedId = useWriteDraftStore((s) => s.editingFeedId);
  const composeHref = `${basePath}/write/compose${editingFeedId ? `?editFeedId=${encodeURIComponent(editingFeedId)}` : ''}`;

  const items = useWriteDraftStore((s) => s.items);
  const addPetTag = useWriteDraftStore((s) => s.addPetTag);
  const removePetTag = useWriteDraftStore((s) => s.removePetTag);
  const movePetTag = useWriteDraftStore((s) => s.movePetTag);

  const [index, setIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [draggingTagId, setDraggingTagId] = useState<string | null>(null);
  const pendingPoint = useRef<{ x: number; y: number } | null>(null);
  const suppressStageClick = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragSession = useRef<{
    tagId: string;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const total = items.length;
  const current = items[index] ?? null;

  useEffect(() => {
    if (useWriteDraftStore.getState().items.length === 0) {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const session = dragSession.current;
      const stage = stageRef.current;
      const item = useWriteDraftStore.getState().items[index];
      if (!session || !stage || !item) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dx = (event.clientX - session.startClientX) / rect.width;
      const dy = (event.clientY - session.startClientY) / rect.height;
      movePetTag(item.id, session.tagId, session.originX + dx, session.originY + dy);
    };
    const onUp = () => {
      if (!dragSession.current) return;
      dragSession.current = null;
      suppressStageClick.current = true;
      setDraggingTagId(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [index, movePetTag]);

  if (index >= total && total > 0) setIndex(total - 1);

  const handleBack = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
      return;
    }
    router.push(composeHref);
  };

  const handleNext = () => {
    if (index >= total - 1) {
      router.push(composeHref);
      return;
    }
    setIndex((i) => i + 1);
  };

  const openSearchAt = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage || !current) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    pendingPoint.current = { x, y };
    setSearchOpen(true);
  };

  const handleSelectPet = (pet: { petId: number; petName: string }) => {
    const point = pendingPoint.current;
    if (!current || !point) {
      setSearchOpen(false);
      return;
    }
    addPetTag(current.id, { petName: pet.petName, petId: pet.petId, x: point.x, y: point.y });
    pendingPoint.current = null;
    setSearchOpen(false);
  };

  const startTagDrag = (tag: WritePhotoPetTag, event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    dragSession.current = {
      tagId: tag.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: tag.x,
      originY: tag.y,
    };
    setDraggingTagId(tag.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  if (!current || total === 0) {
    return (
      <div className={styles.shell}>
        <PageHeader title="사진태그" onBack={() => router.push(composeHref)} />
        <main className={styles.main}>
          <p className={styles.empty}>태그할 사진이 없습니다.</p>
        </main>
        <FooterMenu />
      </div>
    );
  }

  const thumb =
    current.kind === 'image' ? (current.croppedDataUrl ?? current.sourceUrl) : current.sourceUrl;
  const tags = current.petTags ?? [];

  return (
    <div className={styles.shell}>
      <PageHeader
        title={`사진태그(${index + 1}/${total})`}
        onBack={handleBack}
        onSubmit={handleNext}
        submitLabel={index >= total - 1 ? '완료' : '다음'}
      />

      <main className={styles.main}>
        <div
          ref={stageRef}
          className={styles.photoStage}
          role="button"
          tabIndex={0}
          aria-label="사진 태그 위치 선택"
          onClick={(e) => {
            if (draggingTagId || suppressStageClick.current) {
              suppressStageClick.current = false;
              return;
            }
            openSearchAt(e.clientX, e.clientY);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            const stage = stageRef.current;
            if (!stage) return;
            const rect = stage.getBoundingClientRect();
            openSearchAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }}
        >
          {current.kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className={styles.photo} draggable={false} />
          ) : (
            <video
              className={styles.photo}
              src={current.sourceUrl}
              muted
              playsInline
              preload="metadata"
            />
          )}
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={styles.petTagBox}
              style={{ left: `${tag.x * 100}%`, top: `${tag.y * 100}%` }}
              aria-label={`${tag.petName} 태그 이동`}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => startTagDrag(tag, e)}
            >
              <span className={styles.petTagDrag} aria-hidden>
                <GripVertical size={14} strokeWidth={2.4} />
              </span>
              <span className={styles.petTagName}>{tag.petName}</span>
              <button
                type="button"
                className={styles.petTagDelete}
                aria-label={`${tag.petName} 태그 삭제`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  removePetTag(current.id, tag.id);
                }}
              >
                <X size={12} strokeWidth={2.5} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </main>

      <FooterMenu />

      <PhotoTagAccountSearch
        mode="FEED_TAG"
        open={searchOpen}
        onSelect={handleSelectPet}
        onClose={() => {
          pendingPoint.current = null;
          setSearchOpen(false);
        }}
      />
    </div>
  );
}
