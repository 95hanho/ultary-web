import type { FeedGridItem } from '@/components/feed/FeedGrid';
import type { MyUltaryPetCard, MyUltaryProfile } from '@/lib/myultary/fromApi';

export type PublicUltaryView = {
  profile: MyUltaryProfile;
  pets: MyUltaryPetCard[];
  feeds: FeedGridItem[];
  pinned: FeedGridItem[];
  tagged: FeedGridItem[];
};
