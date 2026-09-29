'use client';

import { FeedListPage } from '@/components/feed/FeedListPage';
import type { FeedData } from '@/components/feed/Feed';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { toFeedData } from '@/lib/feed/toFeedData';
import { MY_NICKNAME, myUltaryPath } from '@/lib/mock/ultary-accounts';
import { gridFeedIds } from '@/lib/myultary/fromApi';
import { mapSearchUsers } from '@/lib/search/accounts';
import type { BffEnvelope, MeResponse } from '@/types/api';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

async function loadFeedCards(
  ids: string[],
  detailUrl: string,
): Promise<FeedData[]> {
  const details = await Promise.all(
    ids.map((id) =>
      bffGet<BffEnvelope<unknown>>(detailUrl, { feedId: id }),
    ),
  );
  return details.map((res, i) => toFeedData(res.data, ids[i] ?? `feed-${i}`));
}

export default function MyUltaryPostsClient() {
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

        let ids: string[] = [];
        let detailUrl = bffEndpoints.myUltary.feedDetail;

        if (isMine) {
          const listRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.myUltary.feeds, {
            limit: 50,
          });
          ids = gridFeedIds(listRes.data);
        } else {
          const searchRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.main.search, {
            q: nickname,
            type: 'USER',
          });
          const matched = mapSearchUsers(searchRes.data).find(
            (user) => user.nickname === nickname && user.userNo != null,
          );
          if (!matched?.userNo) return;
          const listRes = await bffGet<BffEnvelope<unknown>>(bffEndpoints.users.feeds, {
            userNo: matched.userNo,
            limit: 50,
          });
          ids = gridFeedIds(listRes.data);
          detailUrl = bffEndpoints.feeds.detail;
        }

        const next = ids.length > 0 ? await loadFeedCards(ids, detailUrl) : [];
        if (!cancelled) setFeeds(next);
      } catch (err) {
        console.error('[myultary] posts load failed', err);
        if (!cancelled) setFeeds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nickname]);

  return (
    <FeedListPage
      title={ownerName ? `${ownerName}님의 피드` : ''}
      backHref={myUltaryPath(nickname)}
      feeds={feeds}
      focusId={postId}
      showAuthor={false}
    />
  );
}
