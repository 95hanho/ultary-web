'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import { FooterMenu } from '@/components/common/FooterMenu';
import { MediaImage } from '@/components/common/MediaImage';
import { PageHeader } from '@/components/common/PageHeader';
import { bffDelete, bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { readFileAsDataUrl } from '@/lib/pending-pet-photo';
import { useModalStore } from '@/stores/modal.store';
import { useTagRequestDraft } from '@/stores/tag-request-draft.store';
import type { BffEnvelope } from '@/types/api';
import { Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import styles from './hashtags.module.scss';

export type TagRequest = {
  requestId: number;
  tagId: number;
  hashtag: string;
  title: string;
  content: string;
  link: string;
  imageUrl: string;
  imageFileIds: number[];
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
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
  const router = useRouter();
  const openModal = useModalStore((s) => s.open);
  const fileRef = useRef<HTMLInputElement>(null);
  const setSource = useTagRequestDraft((s) => s.setSource);
  const [items, setItems] = useState<TagRequest[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [menuRequestId, setMenuRequestId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
        if (!cancelled) setLoadFailed({ error: err });
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

  useEffect(() => {
    if (menuRequestId == null) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      setMenuRequestId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuRequestId(null);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuRequestId]);

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

  function askDelete(item: TagRequest) {
    setMenuRequestId(null);
    openModal({
      variant: 'confirm',
      title: '알림창',
      content: '이 해시태그 요청을 삭제할까요?',
      showCloseButton: true,
      okButton: {
        label: '삭제',
        tone: 'danger',
        onClick: () => {
          void (async () => {
            try {
              await bffDelete<unknown>(bffEndpoints.tags.profileRequestById, {
                requestId: item.requestId,
              });
              setItems((prev) => prev.filter((row) => row.requestId !== item.requestId));
            } catch (err) {
              console.error('[hashtag-requests] delete', err);
              openModal({
                variant: 'alert',
                title: '알림창',
                content: pickErrorMessage(err, '요청을 삭제하지 못했습니다.'),
                showCloseButton: true,
                okButton: { label: '확인', tone: 'primary' },
                cancelButton: { hidden: true },
              });
            }
          })();
        },
      },
    });
  }

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

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
          {items.map((item) => {
            const pending = item.status === 'PENDING';
            const menuOpen = menuRequestId === item.requestId;
            return (
              <li key={item.requestId} className={styles.card}>
                <span className={styles.thumb}>
                  {item.imageUrl ? (
                    <MediaImage
                      src={item.imageUrl}
                      alt=""
                      width={72}
                      height={72}
                      className={styles.thumbImg}
                    />
                  ) : (
                    <span className={styles.thumbEmpty}>사진 없음</span>
                  )}
                </span>
                <span className={styles.body}>
                  <span className={styles.top}>
                    <strong className={styles.hash}>#{item.hashtag}</strong>
                    <span className={statusClass(item.status)}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </span>
                  </span>
                  {item.title ? <span className={styles.title}>{item.title}</span> : null}
                  {item.content ? <span className={styles.content}>{item.content}</span> : null}
                  {item.link ? (
                    <a
                      className={styles.link}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.link}
                    </a>
                  ) : null}
                  {item.rejectMessage ? (
                    <span className={styles.reject}>사유 : {item.rejectMessage}</span>
                  ) : null}
                  <span className={styles.cardFooter}>
                    <span className={styles.time}>
                      요청 {formatWhen(item.createdAt)}
                      {item.reviewedAt ? ` · 검토 ${formatWhen(item.reviewedAt)}` : ''}
                    </span>
                    {pending ? (
                      <div className={styles.moreWrap} ref={menuOpen ? menuRef : undefined}>
                        <button
                          type="button"
                          className={styles.moreBtn}
                          aria-label="더보기"
                          aria-expanded={menuOpen}
                          onClick={() =>
                            setMenuRequestId((id) =>
                              id === item.requestId ? null : item.requestId,
                            )
                          }
                        >
                          <Ellipsis size={22} strokeWidth={2} />
                        </button>
                        {menuOpen ? (
                          <div className={styles.moreMenu} role="menu">
                            <button
                              type="button"
                              className={styles.moreItem}
                              role="menuitem"
                              onClick={() => {
                                setMenuRequestId(null);
                                router.push(`/settings/hashtags/${item.requestId}/edit`);
                              }}
                            >
                              <span className={styles.moreIcon}>
                                <Pencil size={20} strokeWidth={1.75} />
                              </span>
                              <span className={styles.moreLabel}>수정</span>
                            </button>
                            <button
                              type="button"
                              className={styles.moreItem}
                              role="menuitem"
                              onClick={() => askDelete(item)}
                            >
                              <span className={styles.moreIcon}>
                                <Trash2 size={20} strokeWidth={1.75} />
                              </span>
                              <span className={styles.moreLabel}>삭제</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </span>
                </span>
              </li>
            );
          })}
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

export function readRequests(raw: unknown): TagRequest[] {
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
        imageFileIds: readImageFileIds(item.imageFileIds, item.images),
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

function readImageFileIds(rawIds: unknown, rawImages: unknown) {
  if (Array.isArray(rawIds)) {
    return rawIds.filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
  }
  if (!Array.isArray(rawImages)) return [];
  return rawImages.flatMap((image) => {
    if (!isRecord(image)) return [];
    const fileId = typeof image.fileId === 'number' ? image.fileId : Number(image.fileId);
    return Number.isFinite(fileId) ? [fileId] : [];
  });
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
