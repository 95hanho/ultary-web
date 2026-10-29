'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { Profile } from './Profile';
import { PetNamesAndNicknameTag } from '@/components/common/PetNamesAndNicknameTag';
import { resolveFileDisplayUrl } from '@/lib/api/fileUrl';
import { NO_PROFILE_SRC } from '@/lib/profileImage';
import { isRecord } from '@/lib/api/error';
import type { FileSummary } from '@/types/file';
import { bffGet, bffPostJson, bffDelete } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { nicknameTag } from '@/lib/nickname-tag';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import styles from './LinkedUltaries.module.scss';
type UltaryLink = {
  userNo: number;
  nickname: string | null;
  available: boolean;
  petNames?: string[];
  profileFile?: FileSummary | null;
  hasStory?: boolean;
  hasUnviewed?: boolean;
};

function AccountIdentity({ item, query = '' }: { item: UltaryLink; query?: string }) {
  return (
    <>
      <span className={styles.profileArea}>
        <Profile
          imageUrl={resolveFileDisplayUrl(item.profileFile) ?? NO_PROFILE_SRC}
          size={45}
          story="none"
        />
      </span>
      <span className={styles.accountText}>
        <PetNamesAndNicknameTag
          nickname={item.nickname ?? ''}
          petNames={item.petNames ?? []}
          query={query.replace(/^@+/, '')}
        />
      </span>
    </>
  );
}

export function LinkedUltaries({ userNo, own }: { userNo: number; own: boolean }) {
  const [items, setItems] = useState<UltaryLink[]>([]);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const mutationBusy = useRef(false);
  const mutationVersion = useRef(0);
  const refresh = useCallback(async () => {
    const response = await bffGet<BffEnvelope<UltaryLink[]>>(bffEndpoints.users.ultaryLinks, {
      userNo,
    });
    setItems(response.data ?? []);
    setFailed(false);
  }, [userNo]);
  useEffect(() => {
    let cancelled = false;
    const version = mutationVersion.current;
    bffGet<BffEnvelope<UltaryLink[]>>(bffEndpoints.users.ultaryLinks, { userNo })
      .then((response) => {
        if (!cancelled && mutationVersion.current === version) setItems(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled && mutationVersion.current === version) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userNo]);
  const add = () =>
    useModalStore.getState().open({
      variant: 'alert',
      title: '다른 울타리 연결',
      showCloseButton: true,
      content: (
        <PublicUltarySearch
          onPick={async (item) => {
            if (mutationBusy.current) return;
            if (items.some((existing) => existing.userNo === item.userNo)) {
              useModalStore.getState().close();
              return;
            }
            mutationBusy.current = true;
            mutationVersion.current += 1;
            setBusy(true);
            setItems((current) =>
              current.some((existing) => existing.userNo === item.userNo)
                ? current
                : [...current, item],
            );
            useModalStore.getState().close();
            try {
              await bffPostJson(bffEndpoints.myUltary.links, { targetUserNo: item.userNo });
            } catch (error) {
              setItems((current) => current.filter((existing) => existing.userNo !== item.userNo));
              useModalStore.getState().open({
                variant: 'alert',
                title: '울타리 추가 실패!',
                content: linkFailureReason(error),
                showCloseButton: true,
              });
            } finally {
              mutationBusy.current = false;
              setBusy(false);
            }
          }}
        />
      ),
    });
  const remove = async (targetUserNo: number) => {
    if (mutationBusy.current) return;
    const previousItems = items;
    mutationBusy.current = true;
    mutationVersion.current += 1;
    setBusy(true);
    setItems((current) => current.filter((item) => item.userNo !== targetUserNo));
    try {
      await bffDelete(bffEndpoints.myUltary.link, { targetUserNo });
    } catch (error) {
      setItems(previousItems);
      useModalStore.getState().open({
        variant: 'alert',
        title: '울타리 삭제 실패!',
        content: linkFailureReason(error),
        showCloseButton: true,
      });
    } finally {
      mutationBusy.current = false;
      setBusy(false);
    }
  };
  const askRemove = (item: UltaryLink) => {
    if (busy) return;
    useModalStore.getState().open({
      variant: 'confirm',
      title: '다른 울타리 연결 해제',
      content: `${item.nickname ? nicknameTag(item.nickname) : '이 울타리'} 연결을 삭제할까요?`,
      showCloseButton: true,
      okButton: {
        label: '삭제',
        tone: 'danger',
        onClick: () => {
          void remove(item.userNo);
        },
      },
      cancelButton: { label: '취소' },
    });
  };
  if (!own && !items.length && !failed) return null;
  return (
    <section className={styles.root} aria-label="다른 울타리">
      <ul className={styles.list}>
        {items.map((item) => (
          <li className={styles.linkedItem} key={item.userNo}>
            {item.available && item.nickname ? (
              <Link href={myUltaryPath(item.nickname)} className={styles.nicknameLink}>
                {nicknameTag(item.nickname)}
              </Link>
            ) : (
              <span className={styles.unavailable}>
                {item.nickname ? nicknameTag(item.nickname) : '사용할 수 없는 울타리'}
              </span>
            )}
            {own ? (
              <button
                type="button"
                className={styles.remove}
                aria-label={`${item.nickname ? nicknameTag(item.nickname) : '울타리'} 연결 해제`}
                disabled={busy}
                onClick={() => askRemove(item)}
              >
                <X size={14} />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {own ? (
        <button type="button" className={styles.add} onClick={add} disabled={busy}>
          다른 울타리 +
        </button>
      ) : null}
      {failed ? (
        <button
          type="button"
          className={styles.retry}
          disabled={busy}
          onClick={() => void refresh().catch(() => setFailed(true))}
        >
          연결 울타리를 불러오지 못했습니다. 다시 시도
        </button>
      ) : null}
    </section>
  );
}
function linkFailureReason(error: unknown): string {
  if (isRecord(error) && isRecord(error.data)) {
    for (const field of ['detail', 'message', 'reason']) {
      const value = error.data[field];
      if (typeof value === 'string' && value.trim()) return value;
    }
  }
  if (isRecord(error) && typeof error.message === 'string' && error.message.trim())
    return error.message;
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
function PublicUltarySearch({ onPick }: { onPick: (item: UltaryLink) => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ query: string; items: UltaryLink[] } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      bffGet<BffEnvelope<UltaryLink[]>>(bffEndpoints.myUltary.linksSearch, { q: query })
        .then((response) => {
          if (!cancelled) setResult({ query, items: response.data ?? [] });
        })
        .catch(() => {
          if (!cancelled) setError('검색하지 못했습니다. 다시 시도해 주세요.');
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);
  const rows = result?.query === query ? result.items : [];
  return (
    <div className={styles.search}>
      <div className={styles.searchBar}>
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          aria-label="연결할 공개 울타리 검색"
          placeholder="검색"
          value={query}
          disabled={busy}
          onChange={(event) => {
            setQuery(event.target.value);
            setError('');
          }}
        />
        {query ? (
          <button
            type="button"
            className={styles.clear}
            aria-label="검색어 지우기"
            disabled={busy}
            onClick={() => {
              setQuery('');
              setError('');
            }}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <ul>
        {rows.map((item) => (
          <li key={item.userNo} className={styles.item}>
            <button
              type="button"
              className={styles.accountInfo}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onPick(item);
                } catch {
                  setError('울타리를 연결하지 못했습니다. 다시 시도해 주세요.');
                  setBusy(false);
                }
              }}
            >
              <AccountIdentity item={item} query={query} />
            </button>
          </li>
        ))}
      </ul>
      {query.trim() && result?.query === query && !rows.length ? (
        <p>공개된 울타리 검색 결과가 없습니다.</p>
      ) : null}
    </div>
  );
}
