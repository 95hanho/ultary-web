'use client';

import { FeedCollectionClient } from '@/components/my-ultary/FeedCollectionClient';
import { bffEndpoints } from '@/lib/api/endpoints';
import { MOCK_SAVED_FEEDS } from '@/lib/mock/feeds';

export default function MyUltarySavedClient() {
  return (
    <FeedCollectionClient
      listEndpoint={bffEndpoints.myUltary.savedFeeds}
      titleKind="saved"
      mockFeeds={MOCK_SAVED_FEEDS}
    />
  );
}
