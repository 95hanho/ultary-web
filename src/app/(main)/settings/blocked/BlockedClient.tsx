'use client';

import { FooterMenu } from '@/components/common/FooterMenu';
import { MediaImage } from '@/components/common/MediaImage';
import { PageHeader } from '@/components/common/PageHeader';
import { bffDelete, bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import type { FileSummary } from '@/types/file';
import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './blocked.module.scss';

type BlockedUser = {
  userNo: number;
  nickname: string;
  profileUrl: string;
  blockedAtLabel: string;
};

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

function formatBlockedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}월${d.getDate()}일 ${hh}:${mm}`;
}

function asFile(value: unknown): Pick<FileSummary, 'fileId' | 'filePath'> | null {
  if (!isRecord(value)) return null;
  if (typeof value.filePath !== 'string' || !value.filePath.trim()) return null;
  return {
    fileId: typeof value.fileId === 'number' ? value.fileId : 0,
    filePath: value.filePath,
  };
}

function mapBlockedUser(raw: unknown): BlockedUser | null {
  if (!isRecord(raw)) return null;
  const userNo = typeof raw.userNo === 'number' ? raw.userNo : Number(raw.userNo);
  if (!Number.isFinite(userNo)) return null;
  const nickname = typeof raw.nickname === 'string' ? raw.nickname.trim() : '';
  const blockedAt = typeof raw.blockedAt === 'string' ? raw.blockedAt : '';
  return {
    userNo,
    nickname,
    profileUrl: resolveFileDisplayUrl(asFile(raw.profileFile)) ?? NO_PROFILE_SRC,
    blockedAtLabel: blockedAt ? formatBlockedAt(blockedAt) : '',
  };
}

function unwrapList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  return [];
}

/** 설정 > 차단한 사용자. GET /users/blocks */
export default function BlockedClient() {
  const openModal = useModalStore((s) => s.open);
  const [items, setItems] = useState<BlockedUser[]>([]);
  const [status, setStatus] = useState('불러오는 중');
  const [busyUserNo, setBusyUserNo] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.blocks, {
          limit: 30,
        });
        const mapped = unwrapList(res.data)
          .map(mapBlockedUser)
          .filter((item): item is BlockedUser => item != null);
        if (cancelled) return;
        setItems(mapped);
        setStatus(mapped.length === 0 ? '차단한 사용자가 없습니다.' : '');
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setStatus(pickErrorMessage(err, '차단한 사용자를 불러오지 못했습니다.'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function unblock(item: BlockedUser) {
    if (busyUserNo != null) return;
    setBusyUserNo(item.userNo);
    setStatus('');
    try {
      await bffDelete<BffEnvelope<unknown>>(bffEndpoints.users.unblock, {
        userNo: item.userNo,
      });
      setItems((prev) => {
        const next = prev.filter((row) => row.userNo !== item.userNo);
        if (next.length === 0) setStatus('차단한 사용자가 없습니다.');
        return next;
      });
    } catch (err) {
      setStatus(pickErrorMessage(err, '차단을 해제하지 못했습니다.'));
    } finally {
      setBusyUserNo(null);
    }
  }

  function onAction(item: BlockedUser) {
    if (busyUserNo != null) return;
    openModal({
      variant: 'confirm',
      title: '차단 해제',
      content: `${item.nickname || '이 사용자'}님의 차단을 해제할까요?`,
      showCloseButton: true,
      cancelButton: { label: '취소' },
      okButton: {
        label: '차단해제',
        tone: 'danger',
        onClick: () => {
          void unblock(item);
        },
      },
    });
  }

  return (
    <div className={styles.shell}>
      <PageHeader title="차단한 사용자" backHref="/settings" />

      <main className={styles.main}>
        {status ? <p className={styles.status}>{status}</p> : null}
        <ul className={styles.list}>
          {items.map((item) => {
            const ultaryHref = item.nickname ? myUltaryPath(item.nickname) : '';

            return (
              <li key={item.userNo} className={styles.item}>
                <div className={styles.itemBody}>
                  {ultaryHref ? (
                    <Link
                      href={ultaryHref}
                      className={styles.imageWrap}
                      aria-label={`${item.nickname} 울타리`}
                    >
                      <MediaImage
                        src={item.profileUrl}
                        alt=""
                        width={39}
                        height={39}
                        className={styles.image}
                      />
                    </Link>
                  ) : (
                    <span className={styles.imageWrap}>
                      <MediaImage
                        src={item.profileUrl}
                        alt=""
                        width={39}
                        height={39}
                        className={styles.image}
                      />
                    </span>
                  )}
                  <div className={styles.info}>
                    {ultaryHref ? (
                      <Link href={ultaryHref} className={styles.nickname}>
                        {item.nickname}
                      </Link>
                    ) : (
                      <span className={styles.nickname}>{item.nickname}</span>
                    )}
                    <span className={styles.time}>{item.blockedAtLabel}</span>
                  </div>
                  <div className={styles.actionWrap}>
                    <button
                      type="button"
                      className={clsx(styles.actionBtn, styles.actionGray)}
                      disabled={busyUserNo === item.userNo}
                      onClick={() => onAction(item)}
                    >
                      차단해제
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      <FooterMenu />
    </div>
  );
}
