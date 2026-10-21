'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { MediaImage } from '@/components/common/MediaImage';
import { PageHeader } from '@/components/common/PageHeader';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { readFileAsDataUrl } from '@/lib/pending-pet-photo';
import { useTagRequestDraft } from '@/stores/tag-request-draft.store';
import type { BffEnvelope } from '@/types/api';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import styles from './hashtags.module.scss';

type TagRequest = {
  requestId: number;
  tagId: number;
  hashtag: string;
  title: string;
  content: string;
  link: string;
  imageUrl: string;
  status: string;
  rejectMessage: string;
  createdAt: string;
  reviewedAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

/** 설정 > 해시태그 요청 목록 */
export default function HashtagRequestsClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const setSource = useTagRequestDraft((s) => s.setSource);
  const [items, setItems] = useState<TagRequest[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.tags.profileRequests, {
          limit: 50,
        });
        if (cancelled) return;
        setItems(readRequests(res.data));
        setStatus('ready');
      } catch (err) {
        console.error('[hashtag-requests] load', err);
        if (!cancelled) {
          setItems([]);
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const sourceUrl = await readFileAsDataUrl(file);
      setSource(sourceUrl, file.name);
      router.push('/settings/hashtags/crop');
    } catch (err) {
      console.error('[hashtag-requests] file', err);
    }
  }

  return (
    <div className={styles.shell}>
      <PageHeader
        backMode="history"
        title="해시태그 요청"
        backHref="/settings"
        right={
          <button
            type="button"
            className={styles.plusBtn}
            aria-label="해시태그 요청 추가"
            onClick={() => fileRef.current?.click()}
          >
            <Plus size={26} strokeWidth={1.75} />
          </button>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={(event) => void onFile(event)}
      />
      <main className={styles.main}>
        {status === 'loading' ? <p className={styles.status}>불러오는 중</p> : null}
        {status === 'error' ? <p className={styles.status}>요청 목록을 불러오지 못했습니다.</p> : null}
        {status === 'ready' && items.length === 0 ? (
          <p className={styles.status}>요청한 해시태그가 없습니다.</p>
        ) : null}
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.requestId} className={styles.card}>
              <span className={styles.thumb}>
                {item.imageUrl ? (
                  <MediaImage src={item.imageUrl} alt="" width={72} height={72} className={styles.thumbImg} />
                ) : (
                  <span className={styles.thumbEmpty}>사진 없음</span>
                )}
              </span>
              <span className={styles.body}>
                <span className={styles.top}>
                  <strong className={styles.hash}>#{item.hashtag}</strong>
                  <span className={statusClass(item.status)}>{STATUS_LABEL[item.status] ?? item.status}</span>
                </span>
                {item.title ? <span className={styles.title}>{item.title}</span> : null}
                {item.content ? <span className={styles.content}>{item.content}</span> : null}
                {item.link ? <span className={styles.link}>{item.link}</span> : null}
                {item.rejectMessage ? (
                  <span className={styles.reject}>* {item.rejectMessage}</span>
                ) : null}
                <span className={styles.time}>
                  요청 {formatWhen(item.createdAt)}
                  {item.reviewedAt ? ` · 검토 ${formatWhen(item.reviewedAt)}` : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </main>
      <FooterMenu />
    </div>
  );
}

function statusClass(status: string) {
  if (status === 'APPROVED') return styles.badgeApproved;
  if (status === 'REJECTED') return styles.badgeRejected;
  return styles.badgePending;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
}

function readRequests(raw: unknown): TagRequest[] {
  const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.items) ? raw.items : [];
  return list.flatMap((item) => {
    if (!isRecord(item) || typeof item.requestId !== 'number') return [];
    const hashtag = typeof item.hashtag === 'string' ? item.hashtag.trim().replace(/^#/, '') : '';
    if (!hashtag) return [];
    return [
      {
        requestId: item.requestId,
        tagId: typeof item.tagId === 'number' ? item.tagId : 0,
        hashtag,
        title: textOf(item.title),
        content: textOf(item.content),
        link: textOf(item.link),
        imageUrl: firstImage(item.images),
        status: typeof item.status === 'string' ? item.status : '',
        rejectMessage: textOf(item.rejectMessage),
        createdAt: textOf(item.createdAt),
        reviewedAt: textOf(item.reviewedAt),
      },
    ];
  });
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstImage(raw: unknown) {
  if (!Array.isArray(raw)) return '';
  for (const image of raw) {
    if (!isRecord(image) || typeof image.filePath !== 'string') continue;
    const fileId = typeof image.fileId === 'number' ? image.fileId : Number(image.fileId);
    if (!Number.isFinite(fileId)) continue;
    const url = resolveFileDisplayUrl({ fileId, filePath: image.filePath });
    if (url) return url;
  }
  return '';
}
