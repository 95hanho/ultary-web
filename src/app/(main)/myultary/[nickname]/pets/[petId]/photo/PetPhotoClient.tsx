'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { ImageCropper, type CropResult } from '@/components/common/ImageCropper';
import { PageHeader } from '@/components/common/PageHeader';
import { bffPatchJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import type { BffEnvelope } from '@/types/api';
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

  const cropperRef = useRef<{ getResult: () => Promise<CropResult | null> } | null>(null);
  const [photo, setPhoto] = useState<PendingPetPhoto | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultBackHref = myUltaryPath(nickname);
  const backHref = photo?.returnHref ?? defaultBackHref;

  const uploadCroppedFile = async (blob: Blob, fileName: string) => {
    const form = new FormData();
    const name = fileName.trim() || 'pet-profile.png';
    form.append('file', new File([blob], name, { type: blob.type || 'image/png' }));
    const res = await fetch(bffEndpoints.files.root, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    const json = (await res.json().catch(() => null)) as BffEnvelope<unknown> | null;
    const data = json?.data;
    const fileId = isRecord(data) && typeof data.fileId === 'number' ? data.fileId : null;
    if (!res.ok || !json?.success || fileId == null) {
      throw new Error('프로필 사진을 업로드하지 못했습니다.');
    }
    return fileId;
  };

  useEffect(() => {
    const pending = getPendingPetPhoto();
    if (!pending || (petId && pending.petId !== petId)) {
      router.replace(pending?.returnHref ?? defaultBackHref);
      return;
    }
    setTimeout(() => {
      setPhoto(pending);
    }, 0);
  }, [petId, router, defaultBackHref]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await cropperRef.current?.getResult();
      if (!result || !photo) {
        console.warn('[pet-photo] crop result empty');
        return;
      }

      const fileId = await uploadCroppedFile(result.blob, photo.fileName);
      await bffPatchJson<BffEnvelope<unknown>, { petId: string; profileFileId: number }>(
        bffEndpoints.pets.detail,
        { petId: photo.petId, profileFileId: fileId },
      );

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
        <ImageCropper
          src={photo.dataUrl}
          aspect="square"
          cropperRef={cropperRef}
          onReadyChange={setReady}
        />
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
