'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { ImageCropper, type CropResult } from '@/components/common/ImageCropper';
import { PageHeader } from '@/components/common/PageHeader';
import { confirmLeaveWrite } from '@/lib/write/confirm-leave';
import { useStoryDraftStore } from '@/stores/story-draft.store';
import { Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from '@/app/(main)/myultary/[nickname]/write/crop/crop.module.scss';

const UP_HREF = '/stories/up';

/** 스토리 업 — 사진 설정(크롭) / 동영상은 미리보기만 */
export default function StoryCropClient() {
  const router = useRouter();
  const sourceUrl = useStoryDraftStore((s) => s.sourceUrl);
  const kind = useStoryDraftStore((s) => s.kind);
  const setCrop = useStoryDraftStore((s) => s.setCrop);
  const clear = useStoryDraftStore((s) => s.clear);

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const cropperRef = useRef<{ getResult: () => Promise<CropResult | null> } | null>(null);

  useEffect(() => {
    if (!useStoryDraftStore.getState().sourceUrl) {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setReady(kind === 'video');
    cropperRef.current = null;
  }, [kind, sourceUrl]);

  const leave = () => {
    confirmLeaveWrite(() => {
      clear();
      router.back();
    });
  };

  const goNext = async () => {
    if (busy || !sourceUrl || !kind) return;
    setBusy(true);
    try {
      if (kind === 'image') {
        const result = await cropperRef.current?.getResult();
        if (!result) {
          console.warn('[story-crop] crop empty');
          return;
        }
        setCrop(result.dataUrl);
      }
      router.push(UP_HREF);
    } finally {
      setBusy(false);
    }
  };

  if (!sourceUrl || !kind) {
    return (
      <div className={styles.shell}>
        <PageHeader title="사진 설정" onBack={leave} />
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
        title="사진 설정"
        onBack={leave}
        onSubmit={() => void goNext()}
        submitLabel="다음"
        submitDisabled={busy || (kind === 'image' && !ready)}
      />
      <main className={styles.main}>
        {kind === 'image' ? (
          <ImageCropper
            key={sourceUrl}
            src={sourceUrl}
            aspect="free"
            cropperRef={cropperRef}
            onReadyChange={setReady}
          />
        ) : (
          <div className={styles.videoWrap}>
            <video
              className={styles.video}
              src={sourceUrl}
              controls
              playsInline
              preload="metadata"
            />
            <p className={styles.videoHint}>
              <Play size={16} aria-hidden />
              동영상은 별도 자르기 없이 스토리 비율로 업로드됩니다.
            </p>
          </div>
        )}
      </main>
      <FooterMenu />
    </div>
  );
}
