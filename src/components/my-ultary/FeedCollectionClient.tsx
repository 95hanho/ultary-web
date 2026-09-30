'use client';

import { FeedListPage } from '@/components/feed/FeedListPage';
import type { FeedData } from '@/components/feed/Feed';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedData } from '@/lib/feed/toFeedData';
import { MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import { gridFeedIds } from '@/lib/myultary/fromApi';
import type { BffEnvelope, MeResponse } from '@/types/api';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type FeedCollectionClientProps = {
  /** 저장·태그 그리드. 항목은 cover만 있고 사진은 단건 상세에서 채운다 */
  listEndpoint: string;
  titleKind: 'saved' | 'tagged';
  /** 내 계정이 아닐 때 (예시 울타리) */
  mockFeeds?: FeedData[];
};

const EMPTY_FEEDS: FeedData[] = [];

async function loadFeedCards(ids: string[]): Promise<FeedData[]> {
  const details = await Promise.all(
    ids.map((id) =>
      bffGet<BffEnvelope<unknown>>(bffEndpoints.feeds.detail, { feedId: id }),
    ),
  );
  return details.map((res, i) => toFeedData(res.data, ids[i] ?? `feed-${i}`));
}

/** 저장·태그 그리드에서 들어온 게시글 리스트. 화면은 내 게시글 페이지와 같다 */
export function FeedCollectionClient({
  listEndpoint,
  titleKind,
  mockFeeds = EMPTY_FEEDS,
}: FeedCollectionClientProps) {
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
        const meRes = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
        const meNick = meRes.data?.nickname?.trim() ?? '';
        const isMine = nickname === MY_NICKNAME || (meNick !== '' && nickname === meNick);
        if (!cancelled) setOwnerName(isMine && meNick ? meNick : nickname);
        if (!isMine) {
          if (!cancelled) setFeeds(mockFeeds);
          return;
        }

        const listRes = await bffGet<BffEnvelope<unknown>>(listEndpoint, { limit: 50 });
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
  }, [listEndpoint, mockFeeds, nickname]);

  return (
    <FeedListPage
      title={
        titleKind === 'tagged'
          ? '태그된 피드'
          : ownerName
            ? `${ownerName}님의 저장된 피드`
            : ''
      }
      backHref={myUltaryPath(nickname)}
      feeds={feeds}
      focusId={postId}
      showAuthor={titleKind === 'tagged'}
    />
  );
}
