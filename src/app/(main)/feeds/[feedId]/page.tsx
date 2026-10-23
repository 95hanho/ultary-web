import type { FeedData } from '@/components/feed/Feed';
import { GuestFeedView } from '@/components/auth/GuestFeedView';
import { PageLoadError } from '@/components/common/PageLoadError';
import { springEndpoints } from '@/lib/api/endpoints';
import { springGet } from '@/lib/api/springFetch';
import { isRecord } from '@/lib/api/error';
import { getAccessToken, getRefreshToken } from '@/lib/auth/cookies';
import PostClient from '../../posts/[id]/PostClient';
import { toFeedData } from '@/lib/feed/toFeedData';
import { notFound } from 'next/navigation';
import { isUnavailablePageError } from '@/lib/api/page-load-error';

type PageProps = {
  params: Promise<{ feedId: string }>;
  searchParams: Promise<{ mediaIndex?: string | string[] }>;
};

/** 비로그인 공유 피드. 권한 부족·삭제·조회 실패에도 목업을 표시하지 않는다. */
export default async function SharedFeedPage({ params, searchParams }: PageProps) {
  const { feedId } = await params;
  if (!/^[1-9]\d*$/.test(feedId) || !Number.isSafeInteger(Number(feedId))) notFound();
  const query = await searchParams;
  const value = Array.isArray(query.mediaIndex) ? query.mediaIndex[0] : query.mediaIndex;
  const parsed = Number(value);
  const mediaIndex = Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;

  const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
  // 회원 조회는 쿠키를 갱신할 수 있는 BFF에서 수행한다. SSR에서는 재발급하지 않는다.
  if (access || refresh) return <PostClient mediaIndex={mediaIndex} />;

  let feed: FeedData | null = null;
  let loadError: unknown;
  try {
    const raw = await springGet(
      springEndpoints.feeds.detail,
      { feedId },
      undefined,
      // Server Component에서는 쿠키를 수정할 수 없다.
      { recoverExpiredAccess: false },
    );
    if (isRecord(raw) && raw.feedId != null) feed = toFeedData(raw, feedId);
  } catch (error) {
    if (isUnavailablePageError(error)) notFound();
    loadError = error;
  }

  if (!feed) return <PageLoadError error={loadError} />;
  const initialMediaIndex = Math.min(mediaIndex, Math.max(0, feed.images.length - 1));
  return <GuestFeedView feed={feed} initialMediaIndex={initialMediaIndex} />;
}
