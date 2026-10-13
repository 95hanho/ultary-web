'use client';

import { EmptyState } from '@/components/common/EmptyState';
import { FooterMenu } from '@/components/common/FooterMenu';
import { MediaImage } from '@/components/common/MediaImage';
import { PageHeader } from '@/components/common/PageHeader';
import { bffDelete, bffGet, bffPostJson } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError, isRecord } from '@/lib/api/error';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { mapMyUltaryProfile } from '@/lib/myultary/fromApi';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { showFooterNotice } from '@/lib/ui/footerNotice';
import type { BffEnvelope, MeResponse } from '@/types/api';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './relations.module.scss';

const SearchIcon = '/images/icon/Search.svg';

type RelationKind = 'residents' | 'neighbors';

type RelationRow = {
  userNo: number;
  nickname: string;
  imageUrl: string;
  /** 화면용. 응답 mentionId 앞에 @를 붙인 값 */
  petTags: string[];
  neighborId: number | null;
  following: boolean;
};

const TITLES: Record<RelationKind, string> = {
  residents: '팔로우 목록',
  neighbors: '팔로워 목록',
};

export default function RelationListClient({
  userNo,
  kind,
}: {
  userNo: string;
  kind: RelationKind;
}) {
  const [rows, setRows] = useState<RelationRow[]>([]);
  const [meUserNo, setMeUserNo] = useState<number | null>(null);
  const [status, setStatus] = useState('불러오는 중');
  const [busyUserNo, setBusyUserNo] = useState<number | null>(null);
  const [privateHidden, setPrivateHidden] = useState(false);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredRows = useMemo(() => filterRows(rows, query), [query, rows]);

  useEffect(() => {
    if (!userNo) {
      setStatus('목록을 열 수 없습니다.');
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus('불러오는 중');
      setPrivateHidden(false);
      try {
        const [meRes, ultaryRes] = await Promise.all([
          bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me),
          bffGet<BffEnvelope<unknown>>(bffEndpoints.users.ultary, { userNo }),
        ]);
        if (cancelled) return;
        const me = meRes.data?.userNo;
        const meUser = typeof me === 'number' ? me : null;
        setMeUserNo(meUser);
        const profile = mapMyUltaryProfile(ultaryRes.data);
        const own = meUser != null && profile?.userNo === meUser;
        if (!own && profile?.privateAccount === true && profile.following !== true) {
          setRows([]);
          setPrivateHidden(true);
          setStatus('');
          return;
        }
        const listRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.neighbors, {
          userNo,
          type: kind === 'residents' ? 'FOLLOW' : 'FOLLOWER',
          limit: 50,
        });
        if (cancelled) return;
        setRows(readRows(listRes.data));
        setStatus('');
      } catch (err) {
        console.error('[relations] load failed', err);
        if (!cancelled) {
          setRows([]);
          setStatus('목록을 불러오지 못했습니다.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, userNo]);

  const toggle = async (row: RelationRow) => {
    if (busyUserNo != null) return;
    setBusyUserNo(row.userNo);
    try {
      if (row.following) {
        if (row.neighborId == null) throw new Error('neighbor missing');
        await bffDelete(bffEndpoints.users.neighborCancel, { neighborId: row.neighborId });
        setRows((prev) =>
          prev.map((item) =>
            item.userNo === row.userNo ? { ...item, following: false } : item,
          ),
        );
        return;
      }
      const res = await bffPostJson<BffEnvelope<unknown>>(bffEndpoints.users.neighborRequest, {
        userNo: row.userNo,
      });
      const created = readFollowResult(res.data);
      if (!created.accepted) {
        showFooterNotice('팔로우 요청을 보냈습니다.');
        setRows((prev) =>
          prev.map((item) =>
            item.userNo === row.userNo
              ? { ...item, neighborId: created.neighborId ?? item.neighborId }
              : item,
          ),
        );
        return;
      }
      setRows((prev) =>
        prev.map((item) =>
          item.userNo === row.userNo
            ? { ...item, following: true, neighborId: created.neighborId ?? item.neighborId }
            : item,
        ),
      );
    } catch (err) {
      console.error('[relations] toggle failed', err);
      showFooterNotice(relationErrorMessage(err, row.following));
    } finally {
      setBusyUserNo(null);
    }
  };

  return (
    <div className={styles.shell}>
      <PageHeader title={TITLES[kind]} />
      <main className={styles.main}>
        {privateHidden ? (
          <EmptyState title="비공개 계정입니다" />
        ) : status ? (
          <p className={styles.status}>{status}</p>
        ) : (
          <>
            <div className={styles.searchRow}>
              <label className={clsx(styles.searchBar, searchFocused && styles.searchBarFocus)}>
                <Image src={SearchIcon} alt="" width={20} height={20} className={styles.searchIcon} />
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="검색"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  aria-label="닉네임 또는 펫태그 검색"
                />
                {query.length > 0 ? (
                  <button
                    type="button"
                    className={styles.clearQueryBtn}
                    aria-label="검색어 지우기"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setQuery('')}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                      <path
                        d="M3 3l8 8M11 3L3 11"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                ) : null}
              </label>
            </div>
            {filteredRows.length === 0 ? (
              <EmptyState
                title={query.trim() ? '검색 결과가 없어요' : '목록이 비어 있어요'}
              />
            ) : (
          <ul className={styles.accountList}>
            {filteredRows.map((row) => (
              <li key={row.userNo} className={styles.accountItem}>
                <Link href={myUltaryPath(row.nickname)} className={styles.accountBtn}>
                  <span className={styles.accountImageWrap}>
                    <MediaImage
                      src={row.imageUrl}
                      alt=""
                      width={47}
                      height={47}
                      className={styles.accountImage}
                    />
                  </span>
                  <span className={styles.accountText}>
                    <span className={styles.accountNick}>{row.nickname}</span>
                    {row.petTags.length > 0 ? (
                      <span className={styles.accountTags}>{row.petTags.join(' ')}</span>
                    ) : null}
                  </span>
                </Link>
                {meUserNo != null && row.userNo !== meUserNo ? (
                  <button
                    type="button"
                    className={clsx(
                      styles.actionBtn,
                      row.following ? styles.actionDisconnect : styles.actionConnect,
                    )}
                    disabled={busyUserNo === row.userNo}
                    onClick={() => void toggle(row)}
                  >
                    {row.following ? '팔로우 끊기' : '팔로우'}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
            )}
          </>
        )}
      </main>
      <FooterMenu />
    </div>
  );
}

function filterRows(rows: RelationRow[], query: string) {
  const term = query.trim().replace(/^@+/, '').toLowerCase();
  if (!term) return rows;
  return rows.filter((row) => {
    if (row.nickname.toLowerCase().includes(term)) return true;
    return row.petTags.some((tag) => tag.replace(/^@+/, '').toLowerCase().includes(term));
  });
}

function readRows(raw: unknown) {
  const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.items) ? raw.items : [];
  return list.flatMap((item) => {
    if (!isRecord(item) || typeof item.userNo !== 'number') return [];
    const nickname = typeof item.nickname === 'string' ? item.nickname.trim() : '';
    if (!nickname) return [];
    return [
      {
        userNo: item.userNo,
        nickname,
        imageUrl: resolveFileDisplayUrl(asFile(item.profileFile)) ?? NO_PROFILE_SRC,
        petTags: readPetTags(item.petTags),
        neighborId: typeof item.neighborId === 'number' ? item.neighborId : null,
        following: item.following === true,
      },
    ];
  });
}

function readPetTags(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((tag) => {
    if (typeof tag !== 'string') return [];
    const name = tag.trim().replace(/^@+/, '');
    return name ? [`@${name}`] : [];
  });
}

function readFollowResult(raw: unknown) {
  if (!isRecord(raw)) return { neighborId: null as number | null, accepted: false };
  return {
    neighborId: typeof raw.neighborId === 'number' ? raw.neighborId : null,
    accepted: raw.status === 'ACCEPTED',
  };
}

function asFile(raw: unknown) {
  if (!isRecord(raw) || typeof raw.filePath !== 'string' || !raw.filePath.trim()) return null;
  return {
    fileId: typeof raw.fileId === 'number' ? raw.fileId : 0,
    filePath: raw.filePath,
  };
}

function relationErrorMessage(err: unknown, following: boolean) {
  const code = isHttpError(err) && isRecord(err.data) && typeof err.data.code === 'string' ? err.data.code : '';
  if (code === 'NEIGHBOR_ALREADY_EXISTS' || code === 'NEIGHBOR_ALREADY_REQUESTED') {
    return '이미 연결된 사이입니다.';
  }
  if (code === 'NEIGHBOR_PENDING_RECEIVED') return '상대의 요청을 먼저 수락해 주세요.';
  if (code === 'NEIGHBOR_REQUEST_CLOSED') return '팔로우 신청을 받지 않는 계정입니다.';
  return following ? '팔로우를 끊지 못했습니다.' : '팔로우 요청을 보내지 못했습니다.';
}
