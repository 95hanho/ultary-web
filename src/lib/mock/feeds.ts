import type { FeedData } from '@/components/feed/Feed';

const MOCK_PROFILE = '/images/mock/profile.jpg';
const MOCK_POST = '/images/mock/post_ex.jpg';

const LONG_CAPTION =
  '내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용';

export const MOCK_HOME_FEEDS: FeedData[] = [
  {
    id: 'home-1',
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST, MOCK_POST, MOCK_POST],
    caption: LONG_CAPTION,
  },
  {
    id: 'home-2',
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST, MOCK_POST],
    caption: '내용내용내용내용내용내용내용내용내용내용',
  },
  {
    id: 'home-3',
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST],
    caption: '내용내용내용내용내용내용내용내용',
  },
];

export const MOCK_MY_FEEDS: FeedData[] = Array.from({ length: 9 }, (_, i) => ({
  id: `feed-${i + 1}`,
  nickname: 'HAN_HOSEONGS',
  profileUrl: MOCK_PROFILE,
  images: i % 3 === 0 ? [MOCK_POST, MOCK_POST, MOCK_POST] : [MOCK_POST],
  caption: LONG_CAPTION,
}));

export const MOCK_SAVED_FEEDS: FeedData[] = Array.from({ length: 6 }, (_, i) => ({
  id: `saved-${i + 1}`,
  nickname: 'HAN_HOSEONGS',
  profileUrl: MOCK_PROFILE,
  images: i % 2 === 0 ? [MOCK_POST, MOCK_POST] : [MOCK_POST],
  caption: '저장한 게시글 내용내용내용내용내용내용',
}));
