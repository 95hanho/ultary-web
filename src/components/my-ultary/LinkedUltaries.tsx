'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { bffGet, bffPostJson, bffDelete } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { nicknameTag } from '@/lib/nickname-tag';
import { useModalStore } from '@/stores/modal.store';
import type { BffEnvelope } from '@/types/api';
import styles from './LinkedUltaries.module.scss';
type UltaryLink = { userNo: number; nickname: string | null; available: boolean };

export function LinkedUltaries({ userNo, own }: { userNo: number; own: boolean }) {
  const [items, setItems] = useState<UltaryLink[]>([]);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const response = await bffGet<BffEnvelope<UltaryLink[]>>(bffEndpoints.users.ultaryLinks, {
      userNo,
    });
    setItems(response.data ?? []);
    setFailed(false);
  }, [userNo]);
  useEffect(() => {
    let cancelled = false;
    bffGet<BffEnvelope<UltaryLink[]>>(bffEndpoints.users.ultaryLinks, { userNo })
      .then((response) => {
        if (!cancelled) setItems(response.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
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
          onPick={async (targetUserNo) => {
            await bffPostJson(bffEndpoints.myUltary.links, { targetUserNo });
            await refresh();
            useModalStore.getState().close();
          }}
        />
      ),
    });
  const remove = async (targetUserNo: number) => {
    if (busy) return;
    setBusy(true);
    try {
      await bffDelete(bffEndpoints.myUltary.link, { targetUserNo });
      await refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  if (!own && !items.length && !failed) return null;
  return (
    <section className={styles.root} aria-label="다른 울타리">
      <div className={styles.list}>
        {items.map((item) => (
          <span className={styles.item} key={item.userNo}>
            {item.available && item.nickname ? (
              <Link href={myUltaryPath(item.nickname)}>{nicknameTag(item.nickname)}</Link>
            ) : (
              <span>{item.nickname ? nicknameTag(item.nickname) : '사용할 수 없는 울타리'}</span>
            )}
            {own ? (
              <button
                type="button"
                aria-label={`${item.nickname ? nicknameTag(item.nickname) : '울타리'} 연결 해제`}
                disabled={busy}
                onClick={() => void remove(item.userNo)}
              >
                <X size={12} />
              </button>
            ) : null}
          </span>
        ))}
        {own ? (
          <button type="button" className={styles.add} onClick={add}>
            다른 울타리 +
          </button>
        ) : null}
      </div>
      {failed ? (
        <button
          type="button"
          className={styles.retry}
          onClick={() => void refresh().catch(() => setFailed(true))}
        >
          연결 울타리를 불러오지 못했습니다. 다시 시도
        </button>
      ) : null}
    </section>
  );
}
function PublicUltarySearch({ onPick }: { onPick: (userNo: number) => Promise<void> }) {
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
      <input
        aria-label="연결할 공개 울타리 검색"
        placeholder="닉네임태그 또는 펫 이름 검색"
        value={query}
        disabled={busy}
        onChange={(event) => {
          setQuery(event.target.value);
          setError('');
        }}
      />
      {error ? <p role="alert">{error}</p> : null}
      <ul>
        {rows.map((item) => (
          <li key={item.userNo}>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onPick(item.userNo);
                } catch {
                  setError('울타리를 연결하지 못했습니다. 다시 시도해 주세요.');
                  setBusy(false);
                }
              }}
            >
              {nicknameTag(item.nickname ?? '')}
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
