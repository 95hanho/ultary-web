'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { PageHeader } from '@/components/common/PageHeader';
import { TagSearchPanel } from '@/components/search/TagSearchPanel';
import { TagSuggestPreview } from '@/components/write/TagSuggestPreview';
import { splitCaptionTags } from '@/lib/mock/tags';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import {
  getActiveHashtag,
  replaceActiveHashtag,
  type ActiveHashtag,
} from '@/lib/search/hashtag-input';
import { getTextareaCaretRect } from '@/lib/search/textarea-caret';
import { useWriteDraftStore } from '@/stores/write-draft.store';
import clsx from 'clsx';
import { ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './compose.module.scss';

const MultiIcon = '/images/icon/multi.svg';

type SuggestAnchor = { top: number; left: number; bottom: number };

/** 게시글 작성 — 사진 태그·내용 */
export default function WriteComposeClient() {
  const router = useRouter();
  const params = useParams<{ nickname: string }>();
  const nickname = typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];
  const basePath = myUltaryPath(nickname);
  const cropHref = `${basePath}/write/crop`;
  const tagsHref = `${basePath}/write/tags`;

  const items = useWriteDraftStore((s) => s.items);
  const caption = useWriteDraftStore((s) => s.caption);
  const setCaption = useWriteDraftStore((s) => s.setCaption);
  const clear = useWriteDraftStore((s) => s.clear);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeTag, setActiveTag] = useState<ActiveHashtag | null>(null);
  const [suggestAnchor, setSuggestAnchor] = useState<SuggestAnchor | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const activeTagRef = useRef<ActiveHashtag | null>(null);
  activeTagRef.current = activeTag;

  const syncBackdropScroll = () => {
    const backdrop = backdropRef.current;
    const textarea = textareaRef.current;
    if (!backdrop || !textarea) return;
    backdrop.scrollTop = textarea.scrollTop;
  };

  const updateSuggest = useCallback((value: string, caret: number) => {
    const textarea = textareaRef.current;
    const active = getActiveHashtag(value, caret);
    if (!textarea || !active || active.term.length === 0) {
      setActiveTag(null);
      setSuggestOpen(false);
      setSuggestAnchor(null);
      return;
    }

    const rect = getTextareaCaretRect(textarea, active.start);
    setActiveTag(active);
    setSuggestAnchor({
      top: rect.top,
      left: rect.left,
      bottom: rect.top + rect.height,
    });
    setSuggestOpen(true);
  }, []);

  const applyTag = useCallback(
    (tag: string) => {
      const textarea = textareaRef.current;
      const caret = textarea?.selectionStart ?? caption.length;
      const active = getActiveHashtag(caption, caret) ?? activeTagRef.current;
      if (!active) return;

      const { next, caret: nextCaret } = replaceActiveHashtag(caption, active, tag);
      setCaption(next);
      setSuggestOpen(false);
      setTagSearchOpen(false);
      setActiveTag(null);
      setSuggestAnchor(null);

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(nextCaret, nextCaret);
        syncBackdropScroll();
      });
    },
    [caption, setCaption],
  );

  useEffect(() => {
    if (useWriteDraftStore.getState().items.length === 0) {
      router.replace(basePath);
    }
    // 진입 시에만 — 이탈 시 clear와 footer 이동이 겹치지 않게
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const suggestQuery = activeTag?.raw ?? '#';

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
          onClick={() => router.push(tagsHref)}
        >
          <span className={clsx(styles.labelInline, styles.tagLabel)}>사진 태그</span>
          <ChevronRight size={20} className={styles.tagChevron} aria-hidden />
        </button>

        <section className={styles.section} aria-label="내용">
          <h2 className={styles.label}>내용</h2>
          <div className={styles.textareaWrap}>
            <div className={styles.editorShell}>
              <div ref={backdropRef} className={styles.editorBackdrop} aria-hidden>
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
                ref={textareaRef}
                className={styles.textarea}
                value={caption}
                onChange={(e) => {
                  const value = e.target.value;
                  const caret = e.target.selectionStart ?? value.length;
                  setCaption(value);
                  requestAnimationFrame(() => {
                    syncBackdropScroll();
                    updateSuggest(value, caret);
                  });
                }}
                onScroll={() => {
                  syncBackdropScroll();
                  const el = textareaRef.current;
                  if (!el || !suggestOpen) return;
                  updateSuggest(el.value, el.selectionStart ?? el.value.length);
                }}
                onClick={(e) => {
                  const el = e.currentTarget;
                  updateSuggest(el.value, el.selectionStart ?? el.value.length);
                }}
                onKeyUp={(e) => {
                  const el = e.currentTarget;
                  updateSuggest(el.value, el.selectionStart ?? el.value.length);
                }}
                placeholder="내용을 입력하세요. #태그"
                rows={6}
              />
            </div>
          </div>
        </section>
      </main>

      <FooterMenu />

      <TagSuggestPreview
        open={suggestOpen && !tagSearchOpen}
        queryLabel={suggestQuery}
        term={activeTag?.term ?? ''}
        anchor={suggestAnchor}
        onSelect={applyTag}
        onOpenSearch={() => {
          setSuggestOpen(false);
          setTagSearchOpen(true);
        }}
        onClose={() => setSuggestOpen(false)}
      />

      <TagSearchPanel
        open={tagSearchOpen}
        initialQuery={suggestQuery}
        onSelect={applyTag}
        onClose={() => {
          setTagSearchOpen(false);
          requestAnimationFrame(() => textareaRef.current?.focus());
        }}
      />
    </div>
  );
}
