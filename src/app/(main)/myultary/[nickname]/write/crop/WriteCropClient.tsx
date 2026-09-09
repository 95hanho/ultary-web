'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { ImageCropper, type CropResult } from '@/components/common/ImageCropper';
import { PageHeader } from '@/components/common/PageHeader';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { useWriteDraftStore } from '@/stores/write-draft.store';
import { Play } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './crop.module.scss';

/** 게시글 작성 — 사진 설정(크롭) / 동영상은 미리보기만 */
export default function WriteCropClient() {
  const router = useRouter();
  const params = useParams<{ nickname: string }>();
  const nickname = typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];
  const basePath = myUltaryPath(nickname);
  const composeHref = `${basePath}/write/compose`;

  const items = useWriteDraftStore((s) => s.items);
  const updateCrop = useWriteDraftStore((s) => s.updateCrop);
  const clear = useWriteDraftStore((s) => s.clear);

  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const cropperRef = useRef<{ getResult: () => Promise<CropResult | null> } | null>(null);

  const current = items[index] ?? null;
  const total = items.length;

  useEffect(() => {
    if (items.length === 0) {
      router.replace(basePath);
    }
  }, [items.length, router, basePath]);

  useEffect(() => {
    setReady(current?.kind === 'video');
    cropperRef.current = null;
  }, [index, current?.id, current?.kind]);

  const saveCurrentCrop = async () => {
    if (!current || current.kind !== 'image') return true;
    const result = await cropperRef.current?.getResult();
    if (!result) {
      console.warn('[write-crop] crop empty');
      return false;
    }
    updateCrop(current.id, result.dataUrl);
    return true;
  };

  const goPrev = async () => {
    if (busy || index <= 0) return;
    setBusy(true);
    try {
      if (current?.kind === 'image') {
        const ok = await saveCurrentCrop();
        if (!ok) return;
      }
      setIndex((i) => i - 1);
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    if (busy || !current) return;
    setBusy(true);
    try {
      if (current.kind === 'image') {
        const ok = await saveCurrentCrop();
        if (!ok) return;
      }
      if (index >= total - 1) {
        router.push(composeHref);
        return;
      }
      setIndex((i) => i + 1);
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    if (index > 0) {
      void goPrev();
      return;
    }
    clear();
    router.push(basePath);
  };

  if (!current || total === 0) {
    return (
      <div className={styles.shell}>
        <PageHeader title="사진 설정" backHref={basePath} />
        <main className={styles.main}>
          <p className={styles.empty}>미디어를 불러오는 중…</p>
        </main>
        <FooterMenu />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader
        title={`사진 설정(${index + 1}/${total})`}
        onBack={handleBack}
        onSubmit={() => void goNext()}
        submitLabel={index >= total - 1 ? '다음' : '다음'}
        submitDisabled={busy || (current.kind === 'image' && !ready)}
      />
      <main className={styles.main}>
        {current.kind === 'image' ? (
          <ImageCropper
            key={current.id}
            src={current.sourceUrl}
            cropperRef={cropperRef}
            onReadyChange={setReady}
          />
        ) : (
          <div className={styles.videoWrap}>
            <video
              className={styles.video}
              src={current.sourceUrl}
              controls
              playsInline
              preload="metadata"
            />
            <p className={styles.videoHint}>
              <Play size={16} aria-hidden />
              동영상은 별도 자르기 없이 피드 비율로 업로드됩니다.
            </p>
          </div>
        )}
      </main>
      <FooterMenu />
    </div>
  );
}
