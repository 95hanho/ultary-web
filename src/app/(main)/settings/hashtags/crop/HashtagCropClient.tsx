'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { ImageCropper, type CropResult } from '@/components/common/ImageCropper';
import { PageHeader } from '@/components/common/PageHeader';
import { normalizedCropOf } from '@/lib/write/crop-rect';
import { useTagRequestDraft } from '@/stores/tag-request-draft.store';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './crop.module.scss';

/** 해시태그 요청 — 사진 한 장 자르기 */
export default function HashtagCropClient() {
  const router = useRouter();
  const draft = useTagRequestDraft((s) => s.draft);
  const setCrop = useTagRequestDraft((s) => s.setCrop);
  const clear = useTagRequestDraft((s) => s.clear);
  const cropperRef = useRef<{ getResult: () => Promise<CropResult | null> } | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!useTagRequestDraft.getState().draft?.sourceUrl) {
      router.replace('/settings/hashtags');
    }
  }, [router]);

  async function goNext() {
    if (busy || !draft) return;
    setBusy(true);
    try {
      const result = await cropperRef.current?.getResult();
      if (!result) return;
      setCrop(result.dataUrl, normalizedCropOf(result.display, result.displaySize));
      router.push('/settings/hashtags/new');
    } finally {
      setBusy(false);
    }
  }

  if (!draft?.sourceUrl) {
    return (
      <div className={styles.shell}>
        <PageHeader backMode="history" title="사진 설정" backHref="/settings/hashtags" />
        <main className={styles.main}>
          <p className={styles.empty}>사진을 불러오는 중…</p>
        </main>
        <FooterMenu />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader
        backMode="history"
        title="사진 설정"
        onBack={() => {
          clear();
          if (window.history.length > 1) router.back();
          else router.replace('/settings/hashtags');
        }}
        onSubmit={() => void goNext()}
        submitLabel="다음"
        submitDisabled={busy || !ready}
      />
      <main className={styles.main}>
        <ImageCropper
          src={draft.sourceUrl}
          aspect="free"
          initialCrop={draft.cropRect}
          cropperRef={cropperRef}
          onReadyChange={setReady}
        />
      </main>
      <FooterMenu />
    </div>
  );
}
