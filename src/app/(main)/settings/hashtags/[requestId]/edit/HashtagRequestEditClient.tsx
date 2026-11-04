'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { PageLoadError } from '@/components/common/PageLoadError';
import { MediaImage } from '@/components/common/MediaImage';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import type { BffEnvelope } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { readRequests, type TagRequest } from '../../HashtagRequestsClient';
import formStyles from '../../../mypage/mypage.module.scss';
import styles from '../../hashtags.module.scss';

type FieldErrors = {
  title: string | null;
  content: string | null;
  link: string | null;
};

const EMPTY_ERRORS: FieldErrors = {
  title: null,
  content: null,
  link: null,
};

/** 대기 중인 해시태그 요청 수정 — 사진·해시태그 고정 */
export default function HashtagRequestEditClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const id = Number(requestId);
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
  const [item, setItem] = useState<TagRequest | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      router.replace('/settings/hashtags');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.profileRequests, {
          limit: 50,
        });
        if (cancelled) return;
        const found = readRequests(res.data).find((row) => row.requestId === id);
        if (!found || found.status !== 'PENDING') {
          router.replace('/settings/hashtags');
          return;
        }
        setItem(found);
        setTitle(found.title);
        setContent(found.content);
        setLink(found.link);
      } catch (err) {
        console.error('[hashtag-request-edit] load', err);
        if (!cancelled) setLoadFailed({ error: err });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function submit() {
    if (pending || !item) return;
    setFormError(null);
    const nextTitle = title.trim();
    const nextContent = content.trim();
    const nextLink = link.trim();
    const nextErrors: FieldErrors = { ...EMPTY_ERRORS };
    if (!nextTitle) nextErrors.title = '제목을 입력해 주세요.';
    if (!nextContent) nextErrors.content = '소개를 입력해 주세요.';
    if (!nextLink) nextErrors.link = '링크를 입력해 주세요.';
    if (nextErrors.title || nextErrors.content || nextErrors.link) {
      setFieldErrors(nextErrors);
      return;
    }
    if (!item.tagId) {
      setFormError('태그 정보를 찾을 수 없습니다.');
      return;
    }

    setFieldErrors(EMPTY_ERRORS);
    setPending(true);
    try {
      await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.tags.profileRequest, {
        tagId: item.tagId,
        title: nextTitle,
        content: nextContent,
        link: nextLink,
        ...(item.imageFileIds.length > 0 ? { imageFileIds: item.imageFileIds } : {}),
      });
      router.replace('/settings/hashtags');
    } catch (err) {
      console.error('[hashtag-request-edit] submit', err);
      setFormError(pickErrorMessage(err, '해시태그 요청을 수정하지 못했습니다.'));
    } finally {
      setPending(false);
    }
  }

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;
  if (!item) {
    return (
      <div className={formStyles.shell}>
        <PageHeader backMode="history" title="해시태그 요청 수정" backHref="/settings/hashtags" />
      </div>
    );
  }

  return (
    <div className={formStyles.shell}>
      <PageHeader
        backMode="history"
        title="해시태그 요청 수정"
        backHref="/settings/hashtags"
        onSubmit={() => void submit()}
        submitDisabled={pending}
        submitLabel="수정"
      />
      <div className={formStyles.form}>
        {formError ? <p className={formStyles.errorBanner}>{formError}</p> : null}
        <section aria-label="사진">
          <h2 className={styles.photoLabel}>사진</h2>
          <div className={styles.photoRow}>
            <span className={`${styles.photoThumb} ${styles.photoReadonly}`}>
              {item.imageUrl ? (
                <MediaImage
                  src={item.imageUrl}
                  alt=""
                  width={80}
                  height={80}
                  className={styles.photoImg}
                />
              ) : (
                <span className={styles.thumbEmpty}>사진 없음</span>
              )}
            </span>
          </div>
        </section>

        <label className={formStyles.field}>
          <span className={formStyles.label}>해시태그</span>
          <div className={formStyles.inputWrap}>
            <span className={styles.hashtagText}>#{item.hashtag}</span>
            <p className={formStyles.fieldNote}>* 만든 뒤에는 해시태그를 바꿀 수 없습니다.</p>
          </div>
        </label>

        <label className={formStyles.field}>
          <span className={formStyles.label}>제목</span>
          <div className={formStyles.inputWrap}>
            <input
              type="text"
              value={title}
              maxLength={100}
              onChange={(event) => {
                setTitle(event.target.value);
                setFieldErrors((prev) => ({ ...prev, title: null }));
              }}
              placeholder="제목을 입력해주세요."
              className={formStyles.input}
            />
            {fieldErrors.title ? (
              <p className={formStyles.fieldError}>* {fieldErrors.title}</p>
            ) : null}
          </div>
        </label>

        <label className={formStyles.field}>
          <span className={formStyles.label}>소개</span>
          <div className={formStyles.inputWrap}>
            <textarea
              value={content}
              maxLength={500}
              onChange={(event) => {
                setContent(event.target.value);
                setFieldErrors((prev) => ({ ...prev, content: null }));
              }}
              placeholder="소개를 입력해주세요."
              className={`${formStyles.input} ${styles.textarea}`}
            />
            {fieldErrors.content ? (
              <p className={formStyles.fieldError}>* {fieldErrors.content}</p>
            ) : null}
          </div>
        </label>

        <label className={formStyles.field}>
          <span className={formStyles.label}>링크</span>
          <div className={formStyles.inputWrap}>
            <input
              type="url"
              value={link}
              maxLength={200}
              onChange={(event) => {
                setLink(event.target.value);
                setFieldErrors((prev) => ({ ...prev, link: null }));
              }}
              placeholder="https://"
              className={formStyles.input}
            />
            <p className={formStyles.fieldNote}>* 관리자가 승인해야 태그에 공개됩니다.</p>
            {fieldErrors.link ? <p className={formStyles.fieldError}>* {fieldErrors.link}</p> : null}
          </div>
        </label>
      </div>
    </div>
  );
}

function pickErrorMessage(err: unknown, fallback: string) {
  if (isHttpError(err) && isRecord(err.data)) {
    const detail = err.data.detail;
    const message = err.data.message;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
