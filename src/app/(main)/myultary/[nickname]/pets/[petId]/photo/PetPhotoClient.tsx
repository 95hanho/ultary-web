'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { ImageCropper, type CropResult } from '@/components/common/ImageCropper';
import { PageHeader } from '@/components/common/PageHeader';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import {
  clearPendingPetPhoto,
  getPendingPetPhoto,
  type PendingPetPhoto,
} from '@/lib/pending-pet-photo';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './photo.module.scss';

export default function PetPhotoClient() {
  const router = useRouter();
  const params = useParams<{ nickname: string; petId: string }>();
  const nickname = typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];
  const petId = typeof params.petId === 'string' ? params.petId : params.petId?.[0];
  const backHref = myUltaryPath(nickname);

  const cropperRef = useRef<{ getResult: () => Promise<CropResult | null> } | null>(null);
  const [photo, setPhoto] = useState<PendingPetPhoto | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const pending = getPendingPetPhoto();
    if (!pending || (petId && pending.petId !== petId)) {
      router.replace(backHref);
      return;
    }
    setTimeout(() => {
      setPhoto(pending);
    }, 0);
  }, [petId, router, backHref]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await cropperRef.current?.getResult();
      if (!result || !photo) {
        console.warn('[pet-photo] crop result empty');
        return;
      }

      console.log('[pet-photo] submit payload', {
        petId: photo.petId,
        fileName: photo.fileName,
        mimeType: 'image/png',
        originalMimeType: photo.mimeType,
        sourceCrop: result.source,
        displayCrop: result.display,
        naturalSize: result.natural,
        displaySize: result.displaySize,
        blobSize: result.blob.size,
        blobType: result.blob.type,
        dataUrlPreview: `${result.dataUrl.slice(0, 64)}...`,
        dataUrl: result.dataUrl,
        blob: result.blob,
      });

      clearPendingPetPhoto();
      router.push(backHref);
    } catch (err) {
      console.error('[pet-photo] submit failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async () => {
    const result = await cropperRef.current?.getResult();
    if (!result) {
      console.warn('[pet-photo] preview empty');
      return;
    }
    const url = URL.createObjectURL(result.blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  if (!photo) {
    return (
      <div className={styles.shell}>
        <PageHeader title="프로필 사진 설정" backHref={backHref} />
        <main className={styles.main}>
          <p className={styles.empty}>이미지를 불러오는 중…</p>
        </main>
        <FooterMenu />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader
        title="프로필 사진 설정"
        backHref={backHref}
        onSubmit={handleSubmit}
        submitDisabled={!ready || submitting}
      />
      <main className={styles.main}>
        <ImageCropper src={photo.dataUrl} cropperRef={cropperRef} onReadyChange={setReady} />
        {process.env.NODE_ENV === 'development' ? (
          <div className={styles.devActions}>
            <button
              type="button"
              className={styles.previewBtn}
              disabled={!ready}
              onClick={handlePreview}
            >
              이미지 미리보기
            </button>
          </div>
        ) : null}
      </main>
      <FooterMenu />
    </div>
  );
}
