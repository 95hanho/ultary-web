'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { splitCaptionTags } from '@/lib/mock/tags';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { useWriteDraftStore } from '@/stores/write-draft.store';
import clsx from 'clsx';
import { ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import styles from './compose.module.scss';

const MultiIcon = '/images/icon/multi.svg';

/** 게시글 작성 — 사진 태그·내용 */
export default function WriteComposeClient() {
  const router = useRouter();
  const params = useParams<{ nickname: string }>();
  const nickname = typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];
  const basePath = myUltaryPath(nickname);
  const cropHref = `${basePath}/write/crop`;

  const items = useWriteDraftStore((s) => s.items);
  const caption = useWriteDraftStore((s) => s.caption);
  const setCaption = useWriteDraftStore((s) => s.setCaption);
  const clear = useWriteDraftStore((s) => s.clear);

  useEffect(() => {
    if (items.length === 0) {
      router.replace(basePath);
    }
  }, [items.length, router, basePath]);

  const handleSubmit = () => {
    console.log('[write-compose] submit', {
      caption,
      items: items.map((item) => ({
        id: item.id,
        kind: item.kind,
        fileName: item.fileName,
        mimeType: item.mimeType,
        hasCrop: Boolean(item.croppedDataUrl),
      })),
    });
    clear();
    router.push(basePath);
  };

  const captionParts = splitCaptionTags(caption);

  if (items.length === 0) {
    return (
      <div className={styles.shell}>
        <PageHeader title="게시글 작성" backHref={basePath} />
        <main className={styles.main}>
          <p className={styles.empty}>작성 중인 게시글이 없습니다.</p>
        </main>
        <FooterMenu />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <PageHeader
        title="게시글 작성"
        onBack={() => router.push(cropHref)}
        onSubmit={handleSubmit}
        submitLabel="게시"
      />

      <main className={styles.main}>
        <section className={styles.section} aria-label="사진">
          <h2 className={styles.label}>사진</h2>
          <div className={styles.photoRow}>
            {items.map((item, i) => {
              const thumb =
                item.kind === 'image' ? (item.croppedDataUrl ?? item.sourceUrl) : item.sourceUrl;
              return (
                <div key={item.id} className={styles.photoThumb}>
                  {item.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className={styles.photoImg} />
                  ) : (
                    <video
                      className={styles.photoImg}
                      src={item.sourceUrl}
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  {items.length > 1 && i === 0 && item.kind === 'image' ? (
                    <span className={styles.multiBadge} aria-hidden>
                      <Image src={MultiIcon} alt="" width={15} height={14} />
                    </span>
                  ) : null}
                  {item.kind === 'video' ? (
                    <span className={styles.videoBadge} aria-hidden>
                      <Play size={12} fill="#fff" color="#fff" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          className={styles.tagRow}
          onClick={() => {
            console.log('[write-compose] photo tags — TODO');
          }}
        >
          <span className={clsx(styles.labelInline, styles.tagLabel)}>사진 태그</span>
          <ChevronRight size={20} className={styles.tagChevron} aria-hidden />
        </button>

        <section className={styles.section} aria-label="내용">
          <h2 className={styles.label}>내용</h2>
          <div className={styles.textareaWrap}>
            <div className={styles.editorShell}>
              <div className={styles.editorBackdrop} aria-hidden>
                {caption
                  ? captionParts.map((part, i) => {
                      if (part.type === 'tag') {
                        return (
                          <span key={`h-${i}`} className={styles.hashtag}>
                            {part.value}
                          </span>
                        );
                      }
                      return part.value.split('\n').map((line, li, arr) => (
                        <span key={`t-${i}-${li}`}>
                          {line}
                          {li < arr.length - 1 ? <br /> : null}
                        </span>
                      ));
                    })
                  : null}
              </div>
              <textarea
                className={styles.textarea}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="내용을 입력하세요. #태그"
                rows={6}
              />
            </div>
          </div>
        </section>
      </main>

      <FooterMenu />
    </div>
  );
}
