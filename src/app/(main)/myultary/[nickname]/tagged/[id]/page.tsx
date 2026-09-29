import { FeedCollectionClient } from '@/components/my-ultary/FeedCollectionClient';
import { bffEndpoints } from '@/lib/api/endpoints';

export default function MyUltaryTaggedPostPage() {
  return (
    <FeedCollectionClient
      listEndpoint={bffEndpoints.myUltary.taggedFeeds}
      titleKind="tagged"
    />
  );
}
