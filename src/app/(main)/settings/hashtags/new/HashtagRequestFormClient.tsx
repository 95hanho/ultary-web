'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { useTagRequestDraft } from '@/stores/tag-request-draft.store';
import type { BffEnvelope } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import formStyles from '../../mypage/mypage.module.scss';
import styles from '../hashtags.module.scss';

const HASHTAG_RE = /^[A-Za-z0-9가-힣_]{1,30}$/;

/** 해시태그 설명 요청 작성 */
export default function HashtagRequestFormClient() {
  const router = useRouter();
  const draft = useTagRequestDraft((s) => s.draft);
  const clear = useTagRequestDraft((s) => s.clear);
  const [hashtag, setHashtag] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!useTagRequestDraft.getState().draft?.croppedDataUrl) {
      router.replace('/settings/hashtags');
    }
  }, [router]);

  async function submit() {
    if (pending) return;
    setFormError(null);
    const name = hashtag.trim().replace(/^#/, '');
    if (!HASHTAG_RE.test(name)) {
      setFieldError('해시태그는 영문, 숫자, 한글, 언더바(_)만 사용할 수 있습니다. (1~30자, # 제외)');
      return;
    }
    const nextTitle = title.trim();
    const nextContent = content.trim();
    const nextLink = link.trim();
    const photo = draft?.croppedDataUrl;
    if (!nextTitle && !nextContent && !nextLink && !photo) {
      setFieldError('제목, 소개, 링크, 사진 중 하나를 입력해 주세요.');
      return;
    }
    setFieldError(null);
    setPending(true);
    try {
      const imageFileIds = photo ? [await uploadImage(photo, draft?.fileName ?? 'tag.png')] : [];
      const tagId = await resolveTagId(name);
      const body: {
        tagId: number;
        title?: string;
        content?: string;
        link?: string;
        imageFileIds?: number[];
      } = { tagId };
      if (nextTitle) body.title = nextTitle;
      if (nextContent) body.content = nextContent;
      if (nextLink) body.link = nextLink;
      if (imageFileIds.length > 0) body.imageFileIds = imageFileIds;
      await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.tags.profileRequest, body);
      clear();
      router.replace('/settings/hashtags');
    } catch (err) {
      console.error('[hashtag-request] submit', err);
      setFormError(pickErrorMessage(err, '해시태그 요청을 보내지 못했습니다.'));
    } finally {
      setPending(false);
    }
  }

  if (!draft?.croppedDataUrl) {
    return (
      <div className={formStyles.shell}>
        <PageHeader title="해시태그 요청" backHref="/settings/hashtags" />
      </div>
    );
  }

  return (
    <div className={formStyles.shell}>
      <PageHeader
        title="해시태그 요청"
        onBack={() => router.push('/settings/hashtags/crop')}
        onSubmit={() => void submit()}
        submitDisabled={pending}
        submitLabel="요청"
      />
      <div className={formStyles.form}>
        {formError ? <p className={formStyles.errorBanner}>{formError}</p> : null}
        <section aria-label="사진">
          <h2 className={styles.photoLabel}>사진</h2>
          <div className={styles.photoRow}>
            <button
              type="button"
              className={styles.photoThumb}
              aria-label="사진 다시 자르기"
              onClick={() => router.push('/settings/hashtags/crop')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.croppedDataUrl} alt="" className={styles.photoImg} />
            </button>
          </div>
        </section>

        <label className={formStyles.field}>
          <span className={formStyles.label}>해시태그</span>
          <div className={formStyles.inputWrap}>
            <input
              type="text"
              value={hashtag}
              maxLength={31}
              onChange={(event) => {
                setHashtag(event.target.value.replace(/^#/, ''));
                setFieldError(null);
              }}
              placeholder="해시태그를 입력해주세요."
              className={formStyles.input}
            />
            <p className={formStyles.fieldNote}>* 만든 뒤에는 해시태그를 바꿀 수 없습니다.</p>
            {fieldError ? <p className={formStyles.fieldError}>* {fieldError}</p> : null}
          </div>
        </label>

        <label className={formStyles.field}>
          <span className={formStyles.label}>제목</span>
          <div className={formStyles.inputWrap}>
            <input
              type="text"
              value={title}
              maxLength={100}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력해주세요."
              className={formStyles.input}
            />
          </div>
        </label>

        <label className={formStyles.field}>
          <span className={formStyles.label}>소개</span>
          <div className={formStyles.inputWrap}>
            <textarea
              value={content}
              maxLength={500}
              onChange={(event) => setContent(event.target.value)}
              placeholder="소개를 입력해주세요."
              className={`${formStyles.input} ${styles.textarea}`}
            />
          </div>
        </label>

        <label className={formStyles.field}>
          <span className={formStyles.label}>링크</span>
          <div className={formStyles.inputWrap}>
            <input
              type="url"
              value={link}
              maxLength={200}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://"
              className={formStyles.input}
            />
            <p className={formStyles.fieldNote}>* 관리자가 승인해야 태그에 공개됩니다.</p>
          </div>
        </label>
      </div>
    </div>
  );
}

async function resolveTagId(hashtag: string) {
  const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.search, {
    q: hashtag,
    limit: 20,
  });
  const found = readExactTagId(res.data, hashtag);
  if (found != null) return found;
  const created = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.tags.root, { hashtag });
  const tagId = readTagId(created.data);
  if (tagId == null) throw new Error('태그를 만들지 못했습니다.');
  return tagId;
}

function readExactTagId(raw: unknown, hashtag: string) {
  const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.items) ? raw.items : [];
  for (const item of list) {
    if (!isRecord(item) || typeof item.hashtag !== 'string' || typeof item.tagId !== 'number') continue;
    if (item.hashtag.trim().toLowerCase() === hashtag.toLowerCase()) return item.tagId;
  }
  return null;
}

function readTagId(raw: unknown) {
  if (!isRecord(raw) || typeof raw.tagId !== 'number') return null;
  return raw.tagId;
}

async function uploadImage(dataUrl: string, fileName: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const form = new FormData();
  form.append('file', new File([blob], fileName.trim() || 'tag.png', { type: blob.type || 'image/png' }));
  const uploadRes = await fetch(bffEndpoints.files.root, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  const json = (await uploadRes.json().catch(() => null)) as BffEnvelope<unknown> | null;
  const fileId = isRecord(json?.data) && typeof json.data.fileId === 'number' ? json.data.fileId : null;
  if (!uploadRes.ok || !json?.success || fileId == null) {
    throw new Error('사진을 올리지 못했습니다.');
  }
  return fileId;
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
