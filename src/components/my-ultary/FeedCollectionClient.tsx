'use client';

import { FeedListPage } from '@/components/feed/FeedListPage';
import type { FeedData } from '@/components/feed/Feed';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedData } from '@/lib/feed/toFeedData';
import { MOCK_SAVED_FEEDS } from '@/lib/mock/feeds';
import { getUltaryAccount, MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import { gridFeedIds } from '@/lib/myultary/fromApi';
import { mapSearchUsers } from '@/lib/search/accounts';
import type { BffEnvelope, MeResponse } from '@/types/api';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type FeedCollectionClientProps = {
  kind: 'pinned' | 'tagged';
};

async function loadFeedCards(ids: string[]): Promise<FeedData[]> {
  const details = await Promise.all(
    ids.map((id) =>
      bffGet<BffEnvelope<unknown>>(bffEndpoints.feeds.detail, { feedId: id }),
    ),
  );
  return details.map((res, i) => toFeedData(res.data, ids[i] ?? `feed-${i}`));
}

/** 고정·태그 그리드에서 들어온 게시글 리스트 */
export function FeedCollectionClient({ kind }: FeedCollectionClientProps) {
  const params = useParams<{ nickname: string; id: string }>();
  const nicknameParam =
    typeof params.nickname === 'string' ? params.nickname : params.nickname?.[0];
  const nickname = nicknameParam ? decodeURIComponent(nicknameParam) : '';
  const postId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const [feeds, setFeeds] = useState<FeedData[]>([]);
  const [ownerName, setOwnerName] = useState('');

  useEffect(() => {
    if (!nickname) return;
    let cancelled = false;

    (async () => {
      try {
        const mockAccount = getUltaryAccount(nickname);
        if (mockAccount && !mockAccount.isOwnAccount) {
          if (!cancelled) {
            setOwnerName(mockAccount.nickname);
            setFeeds(kind === 'pinned' ? MOCK_SAVED_FEEDS : []);
          }
          return;
        }

        const meRes = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
        const meNick = meRes.data?.nickname?.trim() ?? '';
        const isMine = nickname === MY_NICKNAME || (meNick !== '' && nickname === meNick);
        if (!cancelled) setOwnerName(isMine && meNick ? meNick : nickname);

        let listRes: BffEnvelope<unknown>;
        if (isMine) {
          listRes = await bffGet<BffEnvelope<unknown>>(
            kind === 'pinned'
              ? bffEndpoints.myUltary.pinnedFeeds
              : bffEndpoints.myUltary.taggedFeeds,
            { limit: 50 },
          );
        } else {
          const searchRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
            q: nickname,
            type: 'USER',
          });
          const matched = mapSearchUsers(searchRes.data).find(
            (user) => user.nickname === nickname && user.userNo != null,
          );
          if (!matched?.userNo) {
            if (!cancelled) setFeeds([]);
            return;
          }
          listRes = await bffGet<BffEnvelope<unknown>>(
            kind === 'pinned'
              ? bffEndpoints.users.pinnedFeeds
              : bffEndpoints.users.taggedFeeds,
            { userNo: matched.userNo, limit: 50 },
          );
        }

        const ids = gridFeedIds(listRes.data);
        const next = ids.length > 0 ? await loadFeedCards(ids) : [];
        if (!cancelled) setFeeds(next);
      } catch (err) {
        console.error('[myultary] collection load failed', err);
        if (!cancelled) setFeeds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kind, nickname]);

  return (
    <FeedListPage
      title={
        kind === 'tagged'
          ? '태그된 피드'
          : ownerName
            ? `${ownerName}님의 고정 피드`
            : ''
      }
      backHref={myUltaryPath(nickname)}
      feeds={feeds}
      focusId={postId}
      showAuthor={kind === 'tagged'}
    />
  );
}
