'use client';
import { nicknameTag } from '@/lib/nickname-tag';

import { PageLoadError } from '@/components/common/PageLoadError';

import { FeedListPage } from '@/components/feed/FeedListPage';
import type { FeedData } from '@/components/feed/Feed';
import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { loadCollectionFeeds } from '@/lib/myultary/loadCollectionFeeds';
import { myUltaryPath } from '@/lib/mock/ultary-accounts';
import { gridFeedIds } from '@/lib/myultary/fromApi';
import { mapSearchUsers } from '@/lib/search/accounts';
import type { BffEnvelope, MeResponse } from '@/types/api';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type FeedCollectionClientProps = {
  kind: 'pinned' | 'tagged';
};

/** 고정·태그 그리드에서 들어온 게시글 리스트 */
export function FeedCollectionClient({ kind }: FeedCollectionClientProps) {
  const [missingAccount, setMissingAccount] = useState(false);
  const [loadFailed, setLoadFailed] = useState<{ error: unknown } | null>(null);
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
        if (postId) await bffGet(bffEndpoints.feeds.detail, { feedId: postId });
        const meRes = await bffGet<BffEnvelope<MeResponse>>(bffEndpoints.auth.me);
        const meNick = meRes.data?.nickname?.trim() ?? '';
        const isMine = meNick !== '' && nickname === meNick;
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
            if (!cancelled) setMissingAccount(true);
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
        const next = ids.length > 0 ? await loadCollectionFeeds(ids, postId) : [];
        if (!cancelled) setFeeds(next);
      } catch (err) {
        console.error('[myultary] collection load failed', err);
        if (!cancelled) setLoadFailed({ error: err });
        if (!cancelled) setFeeds([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kind, nickname, postId]);

  if (missingAccount) notFound();
  if (loadFailed) return <PageLoadError error={loadFailed.error} />;

  return (
    <FeedListPage
      title={
        kind === 'tagged'
          ? '태그된 피드'
          : ownerName
            ? `${nicknameTag(ownerName)}님의 고정 피드`
            : ''
      }
      backHref={myUltaryPath(nickname)}
      feeds={feeds}
      focusId={postId}
    />
  );
}
