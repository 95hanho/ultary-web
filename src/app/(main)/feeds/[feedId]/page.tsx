import { GuestFeedView } from '@/components/auth/GuestFeedView';
import type { FeedData } from '@/components/feed/Feed';
import { springEndpoints } from '@/lib/api/endpoints';
import { bearer } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';
import { getAccessToken } from '@/lib/auth/cookies';
import { toFeedData } from '@/lib/feed/toFeedData';
import { MOCK_MY_FEEDS } from '@/lib/mock/feeds';

type PageProps = {
  params: Promise<{ feedId: string }>;
};

function mockFeed(feedId: string): FeedData {
  return (
    MOCK_MY_FEEDS.find((f) => f.id === feedId) ?? {
      ...MOCK_MY_FEEDS[0],
      id: feedId,
    }
  );
}

/**
 * 공유 게시글 단건 (비로그인 허용).
 * share/docs/auth-access.md · spring-auth-api.md
 * — Spring PUBLIC 게스트 GET 가능 시 실데이터, 실패 시 목업.
 */
export default async function SharedFeedPage({ params }: PageProps) {
  const { feedId } = await params;

  let feed = mockFeed(feedId);
  try {
    const access = await getAccessToken();
    const raw = await springGet(
      springEndpoints.feeds.detail,
      { feedId },
      access ? bearer(access) : undefined,
    );
    feed = toFeedData(raw, feedId);
  } catch {
    // Spring 미기동·비PUBLIC·미구현 → 목업으로 게스트 UI 유지
  }

  return <GuestFeedView feed={feed} />;
}
