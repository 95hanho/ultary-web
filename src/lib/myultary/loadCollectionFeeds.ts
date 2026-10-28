import { bffGet } from '@/lib/api/bffFetch';
import { bffEndpoints } from '@/lib/api/endpoints';
import { isHttpError } from '@/lib/api/error';
import { toFeedData } from '@/lib/feed/toFeedData';
import type { FeedData } from '@/components/feed/Feed';
import type { BffEnvelope } from '@/types/api';

/** A sibling may disappear after loading the grid. Never hide errors on the selected post. */
export async function loadCollectionFeeds(ids: string[], focusId?: string): Promise<FeedData[]> {
  const cards = await Promise.all(
    ids.map(async (feedId) => {
      try {
        const response = await bffGet<BffEnvelope<unknown>>(bffEndpoints.feeds.detail, { feedId });
        return toFeedData(response.data, feedId);
      } catch (error) {
        if (feedId !== focusId && isHttpError(error) && [403, 404, 410].includes(error.status))
          return null;
        throw error;
      }
    }),
  );
  return cards.filter((card): card is FeedData => card !== null);
}
