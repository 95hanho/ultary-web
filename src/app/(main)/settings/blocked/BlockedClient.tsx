'use client';

import { PageLoadError } from '@/components/common/PageLoadError';

import { FooterMenu } from '@/components/common/FooterMenu';
import { MediaImage } from '@/components/common/MediaImage';
import { PageHeader } from '@/components/common/PageHeader';
import { bffDelete, bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
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
  blocked: boolean;
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
    blocked: true,
  };
}

function unwrapList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  return [];
}

/** 설정 > 차단한 사용자. GET /users/blocks */
export default function BlockedClient() {
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
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
        setLoadFailed({ error: err });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleBlock(item: BlockedUser) {
    if (busyUserNo != null) return;
    setBusyUserNo(item.userNo);
    setStatus('');
    try {
      if (item.blocked) {
        await bffDelete<BffEnvelope<unknown>>(bffEndpoints.users.unblock, {
          userNo: item.userNo,
        });
      } else {
        await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.users.block, {
          userNo: item.userNo,
        });
      }
      // Keep released rows only in this mounted page so they can be blocked again.
      setItems((prev) => prev.map((row) => row.userNo === item.userNo
        ? { ...row, blocked: !item.blocked, blockedAtLabel: item.blocked ? row.blockedAtLabel : formatBlockedAt(new Date().toISOString()) }
        : row));
    } catch (err) {
      setStatus(pickErrorMessage(err, item.blocked ? '차단을 해제하지 못했습니다.' : '차단하지 못했습니다.'));
    } finally {
      setBusyUserNo(null);
    }
  }

  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

  return (
    <div className={styles.shell}>
      <PageHeader backMode="history" title="차단한 사용자" backHref="/settings" />

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
                    <span className={styles.time}>{item.blocked ? item.blockedAtLabel : '차단 해제됨'}</span>
                  </div>
                  <div className={styles.actionWrap}>
                    <button
                      type="button"
                      className={clsx(styles.actionBtn, item.blocked ? styles.actionGray : styles.actionBlue)}
                      disabled={busyUserNo != null}
                      onClick={() => void toggleBlock(item)}
                    >
                      {busyUserNo === item.userNo ? '처리 중…' : item.blocked ? '차단해제' : '차단'}
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
