'use client';
import { useResettableState } from '@/lib/react/useResettableState';

import { PageLoadError } from '@/components/common/PageLoadError';

import { SubjectPetPicker } from '@/components/common/SubjectPetPicker';
import { VisibilityPicker } from '@/components/common/VisibilityPicker';
import { FooterMenu } from '@/components/common/FooterMenu';
import { FullScreenLoading } from '@/components/common/FullScreenLoading';
import { PageHeader } from '@/components/common/PageHeader';
import { HashtagResultList } from '@/components/search/HashtagResultList';
import { notifyAiContentBlocked } from '@/lib/ai/content-blocked';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { clampFeedContent, FEED_CONTENT_MAX_LENGTH } from '@/lib/content/limits';
import { createFeedFromDraft } from '@/lib/feed/createFeed';
import { loadFeedEditDraft, updateFeedFromDraft } from '@/lib/feed/editFeed';
import type { MockHashtag } from '@/lib/mock/search';
import { splitCaptionTags } from '@/lib/mock/tags';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { mapSearchTags } from '@/lib/search/accounts';
import { useModalStore } from '@/stores/modal.store';
import {
  appendHashtagIfAbsent,
  atomicHashtagRangeForBackspace,
  atomicHashtagRangeForDelete,
  captionHasHashtag,
  captionPlainLengthExcluding,
  getActiveHashtag,
  hasCompletedSingleCharHashtag,
  normalizeHashtagBody,
  replaceActiveHashtag,
  shouldWarnSingleCharHashtag,
  stripExistingHashtags,
  type ActiveHashtag,
} from '@/lib/search/hashtag-input';
import { resolveExistingHashtagBodies } from '@/lib/tag/existing-hashtags';
import {
  mapRecommendTags,
  MOCK_RECOMMEND_TAGS,
  USE_MOCK_TAG_RECOMMEND,
  type RecommendTag,
} from '@/lib/tag/recommend';
import { useWriteDraftStore } from '@/stores/write-draft.store';
import type { FeedVisibility } from '@/types/enums';
import type { BffEnvelope } from '@/types/api';
import clsx from 'clsx';
import { ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import styles from './compose.module.scss';

const MultiIcon = '/images/icon/multi.svg';
const SUGGEST_LIMIT = 10;
const SUGGEST_DELAY_MS = 300;
const RECOMMEND_MIN_PLAIN = 20;
const RECOMMEND_LIMIT = 5;

function submitFailureMessage(error: unknown) {
  if (isHttpError(error)) {
    if (isRecord(error.data)) {
      for (const value of [error.data.detail, error.data.message]) {
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
    }
    if (error.message === 'REQUEST_TIMEOUT')
      return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return '게시글을 올리지 못했습니다. 다시 시도해 주세요.';
}

/** 게시글 작성 — 사진 태그·내용 */
export default function WriteComposeClient({ editFeedId }: { editFeedId?: string }) {
  const router = useRouter();
  const params = useParams<{ nickname: string }>();
  const nickname = typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];
  const basePath = myUltaryPath(nickname);
  const cropHref = `${basePath}/write/crop`;
  const tagsHref = `${basePath}/write/tags`;

  const subjectPetIds = useWriteDraftStore((s) => s.subjectPetIds);
  const setSubjectPetIds = useWriteDraftStore((s) => s.setSubjectPetIds);
  const items = useWriteDraftStore((s) => s.items);
  const visibility = useWriteDraftStore((s) => s.visibility);
  const setVisibility = useWriteDraftStore((s) => s.setVisibility);
  const [visibilityError, setVisibilityError] = useState<{ error: unknown } | null>(null);
  const [defaultVisibility, setDefaultVisibility] = useState<FeedVisibility | null>(null);
  const caption = useWriteDraftStore((s) => s.caption);
  const setCaption = useWriteDraftStore((s) => s.setCaption);
  const clear = useWriteDraftStore((s) => s.clear);
  const editingFeedId = useWriteDraftStore((s) => s.editingFeedId);
  const beginEditing = useWriteDraftStore((s) => s.beginEditing);
  const isEditing = editFeedId != null;
  const pageTitle = isEditing ? '게시글 수정' : '게시글 작성';
  const [editError, setEditError] = useState<{
    id: string;
    message: string;
    error: unknown;
  } | null>(null);
  const editErrorMessage = editError?.id === editFeedId ? editError?.message : null;
  const loadingEdit = isEditing && editingFeedId !== editFeedId && !editErrorMessage;
  const returnHref = isEditing ? `${basePath}/posts/${editFeedId}` : cropHref;

  useEffect(() => {
    if (!editFeedId || useWriteDraftStore.getState().editingFeedId === editFeedId) return;
    let cancelled = false;
    loadFeedEditDraft(editFeedId)
      .then((draft) => {
        if (!cancelled)
          beginEditing(
            editFeedId,
            draft.items,
            draft.caption,
            draft.visibility,
            draft.subjectPetIds,
          );
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setEditError({ id: editFeedId, message: submitFailureMessage(error), error });
      });
    return () => {
      cancelled = true;
    };
  }, [editFeedId, beginEditing]);
  useEffect(() => {
    if (isEditing || editingFeedId != null) return;
    let cancelled = false;
    bffGet<BffEnvelope<{ feedVisibility: FeedVisibility }>>(bffEndpoints.settings.privacy)
      .then((response) => {
        const next = response.data?.feedVisibility;
        if (next !== 'PUBLIC' && next !== 'NEIGHBORS' && next !== 'PRIVATE') {
          throw new Error('공개 범위를 불러오지 못했습니다.');
        }
        if (!cancelled) setDefaultVisibility(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) setVisibilityError({ error });
      });
    return () => {
      cancelled = true;
    };
  }, [isEditing, editingFeedId]);

  const photoTagCount = items.reduce((sum, item) => sum + (item.petTags?.length ?? 0), 0);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeTag, setActiveTag] = useState<ActiveHashtag | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestItems, setSuggestItems] = useResettableState<MockHashtag[]>(
    [],
    [suggestOpen, activeTag?.term],
  );
  const [suggestReady, setSuggestReady] = useResettableState(false, [suggestOpen, activeTag?.term]);
  const [tagWarn, setTagWarn] = useState(false);
  const [tagWarnFromBlur, setTagWarnFromBlur] = useState(false);
  const [recommendItems, setRecommendItems] = useState<RecommendTag[]>([]);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const recommendRequestRef = useRef<{ caption: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showLoading = submitting || loadingEdit;
  /** DB에 있는(선택된 tagId / 조회 확인된) 해시태그 본문 — 소문자, `#` 없음 */
  const [existingTagBodies, setExistingTagBodies] = useState<Set<string>>(() => new Set());
  const activeTagRef = useRef<ActiveHashtag | null>(null);
  useLayoutEffect(() => {
    activeTagRef.current = activeTag;
  });
  const openModal = useModalStore((s) => s.open);

  const markExistingTag = useCallback((tag: string) => {
    const key = normalizeHashtagBody(tag);
    if (!key) return;
    setExistingTagBodies((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const plainLength = useMemo(
    () => captionPlainLengthExcluding(caption, existingTagBodies),
    [caption, existingTagBodies],
  );
  const recommendEnabled = plainLength >= RECOMMEND_MIN_PLAIN;
  const [recommendHint, setRecommendHint] = useResettableState(
    false,
    [recommendEnabled],
    recommendEnabled,
  );

  const syncBackdropScroll = () => {
    const backdrop = backdropRef.current;
    const textarea = textareaRef.current;
    if (!backdrop || !textarea) return;
    backdrop.scrollTop = textarea.scrollTop;
  };

  const clearTagWarnIfValid = useCallback((value: string) => {
    if (!hasCompletedSingleCharHashtag(value)) {
      setTagWarn(false);
      setTagWarnFromBlur(false);
    }
  }, []);

  const updateSuggest = useCallback(
    (value: string, caret: number) => {
      const active = getActiveHashtag(value, caret);
      if (!active || active.term.length === 0) {
        setActiveTag(null);
        setSuggestOpen(false);
        setSuggestItems([]);
        return;
      }

      setActiveTag(active);
      if (active.term.length < 2) {
        setSuggestOpen(false);
        setSuggestItems([]);
        setSuggestReady(false);
        return;
      }

      setSuggestOpen(true);
    },
    [setSuggestItems, setSuggestReady],
  );

  const focusCaptionAt = useCallback(
    (next: string, nextCaret: number) => {
      const clamped = clampFeedContent(next);
      const caret = Math.min(nextCaret, clamped.length);
      setCaption(clamped);
      clearTagWarnIfValid(clamped);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(caret, caret);
        syncBackdropScroll();
        updateSuggest(clamped, caret);
      });
    },
    [setCaption, clearTagWarnIfValid, updateSuggest],
  );

  const applyTag = useCallback(
    (tag: string, tagId?: number | null) => {
      const textarea = textareaRef.current;
      const caret = textarea?.selectionStart ?? caption.length;
      const active = getActiveHashtag(caption, caret) ?? activeTagRef.current;
      if (!active) return;

      const { next, caret: nextCaret } = replaceActiveHashtag(caption, active, tag);
      if (next.length > FEED_CONTENT_MAX_LENGTH) return;
      if (tagId != null) markExistingTag(tag);
      setSuggestOpen(false);
      setActiveTag(null);
      setSuggestItems([]);
      setSuggestReady(false);
      focusCaptionAt(next, nextCaret);
    },
    [caption, focusCaptionAt, markExistingTag, setSuggestItems, setSuggestReady],
  );

  const applyRecommendTag = useCallback(
    (item: RecommendTag) => {
      const { next, caret, added } = appendHashtagIfAbsent(caption, item.tag);
      if (!added || next.length > FEED_CONTENT_MAX_LENGTH) return;
      if (item.tagId != null) markExistingTag(item.tag);
      focusCaptionAt(next, caret);
    },
    [caption, focusCaptionAt, markExistingTag],
  );

  useEffect(() => {
    // 앞뒤 공백을 제외한 원문이 사라지면 결과와 진행 중 요청을 함께 무효화한다.
    const unsubscribe = useWriteDraftStore.subscribe(({ caption: nextCaption }) => {
      const request = recommendRequestRef.current;
      if (!request || nextCaption.trim().includes(request.caption)) return;
      recommendRequestRef.current = null;
      setRecommendItems([]);
      setRecommendOpen(false);
      setRecommendLoading(false);
      setRecommendHint(false);
    });
    return () => {
      unsubscribe();
      recommendRequestRef.current = null;
    };
  }, [setRecommendHint]);

  const requestRecommend = useCallback(async () => {
    const request = { caption: caption.trim() };
    recommendRequestRef.current = request;
    setRecommendHint(false);
    setRecommendItems([]);
    setRecommendLoading(true);
    setRecommendOpen(true);
    try {
      if (USE_MOCK_TAG_RECOMMEND) {
        await new Promise((r) => window.setTimeout(r, 200));
        if (recommendRequestRef.current !== request) return;
        setRecommendItems(MOCK_RECOMMEND_TAGS);
        return;
      }

      const resolved = await resolveExistingHashtagBodies(caption, existingTagBodies);
      if (recommendRequestRef.current !== request) return;
      setExistingTagBodies(resolved);
      const q = stripExistingHashtags(caption, resolved).trim();
      if (q.length < RECOMMEND_MIN_PLAIN) {
        setRecommendHint(true);
        setRecommendItems([]);
        return;
      }
      const res = await bffGet<BffEnvelope<unknown>>(
        bffEndpoints.tags.recommend,
        {
          q,
          limit: RECOMMEND_LIMIT,
        },
        undefined,
        { timeoutMs: 70000 },
      );
      if (recommendRequestRef.current !== request) return;
      const mapped = mapRecommendTags(res.data ?? res);
      setRecommendItems(mapped);
      for (const item of mapped) {
        if (item.tagId != null) markExistingTag(item.tag);
      }
    } catch (err) {
      if (recommendRequestRef.current !== request) return;
      console.error('[write-compose] tag recommend failed', err);
      setRecommendItems([]);
      useModalStore.getState().open({
        variant: 'alert',
        title: '알림창',
        content:
          '서버 오류로 태그 추천을 잠시 사용할 수 없습니다. 불편을 드려 죄송합니다. 잠시 후 다시 시도해 주세요.',
        showCloseButton: true,
      });
    } finally {
      if (recommendRequestRef.current === request) setRecommendLoading(false);
    }
  }, [caption, existingTagBodies, markExistingTag, setRecommendHint]);

  const suggestTerm = activeTag?.term ?? '';
  useEffect(() => {
    if (!suggestOpen || suggestTerm.length < 2) return;
    const term = suggestTerm;
    let cancelled = false;
    setSuggestReady(false);
    const timer = window.setTimeout(() => {
      bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.search, {
        q: term,
        limit: SUGGEST_LIMIT,
      })
        .then((res) => {
          if (cancelled) return;
          const items = mapSearchTags(res.data ?? res);
          setSuggestItems(items);
          for (const item of items) if (item.tagId != null) markExistingTag(item.tag);
          setSuggestReady(true);
        })
        .catch((err) => {
          console.error('[write-compose] tag suggest failed', err);
          if (cancelled) return;
          setSuggestItems([]);
          setSuggestReady(true);
        });
    }, SUGGEST_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [suggestOpen, suggestTerm, markExistingTag, setSuggestItems, setSuggestReady]);

  useEffect(() => {
    if (editFeedId) return;
    if (useWriteDraftStore.getState().editingFeedId != null) clear();
    if (useWriteDraftStore.getState().items.length === 0) {
      router.replace('/');
    }
    // 진입 시에만 — 이탈 시 clear와 footer 이동이 겹치지 않게
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (submitting || items.length === 0 || visibility == null) return;
    setSubmitting(true);
    try {
      if (editFeedId)
        await updateFeedFromDraft(editFeedId, caption, items, visibility, subjectPetIds);
      else await createFeedFromDraft({ caption, items, visibility, subjectPetIds });
      clear();
      router.push(editFeedId ? `${basePath}/posts/${editFeedId}` : basePath);
      router.refresh();
    } catch (err) {
      if (
        notifyAiContentBlocked(err, () => requestAnimationFrame(() => textareaRef.current?.focus()))
      )
        return;
      console.error('[write-compose] submit failed', err);
      openModal({
        variant: 'alert',
        title: '알림창',
        content: submitFailureMessage(err),
        showCloseButton: true,
        okButton: { label: '확인', tone: 'primary' },
        cancelButton: { hidden: true },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const captionParts = splitCaptionTags(caption);
  const suggestQuery = activeTag?.raw ?? '';
  const showMinLengthHint = !tagWarn && activeTag?.term.length === 1;
  const showSuggestOverlay = suggestOpen && suggestReady && suggestItems.length > 0;
  const visibleRecommend = recommendItems.filter((item) => !captionHasHashtag(caption, item.tag));

  if (editErrorMessage || visibilityError)
    return <PageLoadError error={editErrorMessage ? editError?.error : visibilityError?.error} />;

  if (items.length === 0 || (isEditing ? editingFeedId !== editFeedId : editingFeedId != null)) {
    return (
      <div className={styles.shell} inert={showLoading} aria-busy={showLoading}>
        <FullScreenLoading
          open={showLoading}
          label={loadingEdit ? '게시글을 불러오는 중입니다.' : undefined}
        />
        <PageHeader title={pageTitle} backHref={basePath} />
        <main className={styles.main}>
          <p className={styles.empty}>
            {editErrorMessage ??
              (loadingEdit ? '게시글을 불러오는 중입니다.' : '작성 중인 게시글이 없습니다.')}
          </p>
        </main>
        <FooterMenu />
      </div>
    );
  }

  return (
    <div className={styles.shell} inert={showLoading} aria-busy={showLoading}>
      <FullScreenLoading
        open={showLoading}
        label={isEditing ? '게시글을 수정하고 있습니다. 잠시만 기다려 주세요.' : undefined}
      />
      <PageHeader
        title={pageTitle}
        onBack={() => router.push(returnHref)}
        onSubmit={() => void handleSubmit()}
        submitLabel={
          submitting ? (isEditing ? '수정 중…' : '게시 중…') : isEditing ? '수정' : '게시'
        }
        submitDisabled={submitting || items.length === 0 || visibility == null}
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

        <button type="button" className={styles.tagRow} onClick={() => router.push(tagsHref)}>
          <span className={clsx(styles.labelInline, styles.tagLabel)}>
            사진 태그({photoTagCount})
          </span>
          <ChevronRight size={20} className={styles.tagChevron} aria-hidden />
        </button>

        <SubjectPetPicker value={subjectPetIds} onChange={setSubjectPetIds} disabled={submitting} />
        <section className={styles.visibilitySection}>
          <VisibilityPicker
            label="공개 범위"
            labelClassName={styles.visibilityLabel}
            value={visibility}
            disabled={submitting}
            onChange={setVisibility}
          />
          {!isEditing && (defaultVisibility === 'NEIGHBORS' || defaultVisibility === 'PRIVATE') ? (
            <p className={styles.visibilityStatus} role="status">
              {`* 게시글 기본 공개 범위가 ${defaultVisibility === 'NEIGHBORS' ? "'팔로우'로" : "'나만'으로"} 되어있습니다.`}
            </p>
          ) : null}
        </section>

        <section className={styles.section} aria-label="내용">
          <h2 className={styles.label}>
            내용({caption.length}/{FEED_CONTENT_MAX_LENGTH})
          </h2>
          <div className={styles.contentBody}>
            <div className={styles.textareaWrap}>
              <div className={clsx(styles.editorShell, caption.length > 0 && styles.hasContent)}>
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
                  maxLength={FEED_CONTENT_MAX_LENGTH}
                  onChange={(e) => {
                    const value = clampFeedContent(e.target.value);
                    const caret = Math.min(e.target.selectionStart ?? value.length, value.length);
                    setCaption(value);
                    clearTagWarnIfValid(value);
                    requestAnimationFrame(() => {
                      syncBackdropScroll();
                      updateSuggest(value, caret);
                    });
                  }}
                  onScroll={syncBackdropScroll}
                  onClick={(e) => {
                    const el = e.currentTarget;
                    updateSuggest(el.value, el.selectionStart ?? el.value.length);
                  }}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    const el = e.currentTarget;
                    const value = el.value;
                    const start = el.selectionStart ?? value.length;
                    const end = el.selectionEnd ?? start;

                    if ((e.key === 'Backspace' || e.key === 'Delete') && start === end) {
                      const range =
                        e.key === 'Backspace'
                          ? atomicHashtagRangeForBackspace(value, start)
                          : atomicHashtagRangeForDelete(value, start);
                      if (range) {
                        e.preventDefault();
                        const next = `${value.slice(0, range.start)}${value.slice(range.end)}`;
                        focusCaptionAt(next, range.start);
                        return;
                      }
                    }

                    if (e.key !== ' ' && e.key !== 'Enter') return;
                    const active = getActiveHashtag(value, start);
                    if (active && active.term.length === 1) {
                      setTagWarn(true);
                      setTagWarnFromBlur(false);
                    }
                  }}
                  onKeyUp={(e) => {
                    const el = e.currentTarget;
                    updateSuggest(el.value, el.selectionStart ?? el.value.length);
                  }}
                  onFocus={() => {
                    if (tagWarnFromBlur) {
                      setTagWarn(false);
                      setTagWarnFromBlur(false);
                    }
                    const el = textareaRef.current;
                    if (!el) return;
                    updateSuggest(el.value, el.selectionStart ?? el.value.length);
                  }}
                  onBlur={() => {
                    const el = textareaRef.current;
                    if (!el) return;
                    if (
                      shouldWarnSingleCharHashtag(el.value, el.selectionStart ?? el.value.length)
                    ) {
                      setTagWarn(true);
                      setTagWarnFromBlur(true);
                    }
                    setSuggestOpen(false);
                    setActiveTag(null);
                    setSuggestItems([]);
                    setSuggestReady(false);
                  }}
                  placeholder="내용을 입력하세요. #태그"
                  rows={6}
                />
              </div>
              {tagWarn ? (
                <p className={styles.tagWarn} role="alert">
                  * 한 글자는 태그로 사용할 수 없습니다.
                </p>
              ) : null}
              {showMinLengthHint ? (
                <p className={styles.tagHint} role="status">
                  2글자 이상 입력해주세요.
                </p>
              ) : null}
            </div>

            <div
              className={clsx(styles.belowEditor, showSuggestOverlay && styles.belowEditorCovered)}
            >
              <div className={styles.recommendBlock} aria-hidden={showSuggestOverlay}>
                <div className={styles.recommendRow}>
                  <button
                    type="button"
                    className={styles.recommendBtn}
                    disabled={!recommendEnabled || recommendLoading}
                    aria-describedby="tag-recommend-guide"
                    onClick={() => void requestRecommend()}
                  >
                    {recommendLoading ? '추천 중…' : '태그 추천'}
                  </button>
                  <p id="tag-recommend-guide" className={styles.recommendHint}>
                    * 20글자 이상 입력하시면 그에 맞는 태그를 추천합니다.
                  </p>
                </div>
                {recommendHint ? (
                  <p className={styles.recommendHint} role="status">
                    본문(기존 태그 제외)을 20자 이상 입력해 주세요.
                  </p>
                ) : null}
                {recommendEnabled &&
                recommendOpen &&
                !recommendLoading &&
                visibleRecommend.length > 0 ? (
                  <div className={styles.recommendPanel}>
                    <ul className={styles.recommendList} aria-label="추천 태그">
                      {visibleRecommend.map((item) => (
                        <li key={item.tag}>
                          <button
                            type="button"
                            className={styles.recommendChip}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyRecommendTag(item)}
                          >
                            {item.tag}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {recommendEnabled &&
                recommendOpen &&
                !recommendLoading &&
                visibleRecommend.length === 0 ? (
                  <p className={styles.recommendHint} role="status">
                    추천할 태그가 없어요.
                  </p>
                ) : null}
              </div>

              {showSuggestOverlay ? (
                <div className={styles.suggestOverlay}>
                  <HashtagResultList
                    items={suggestItems}
                    highlightQuery={suggestQuery}
                    onSelect={(tag) => {
                      const hit = suggestItems.find((item) => item.tag === tag);
                      applyTag(tag, hit?.tagId);
                    }}
                    variant="page"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <FooterMenu />
    </div>
  );
}
