import type { FeedData } from '@/components/feed/Feed';

const MOCK_PROFILE = '/images/mock/profile.jpg';
const MOCK_POST = '/images/mock/post_ex.jpg';

const LONG_CAPTION =
  '오늘 간식은 #royalcanin 내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용';

export const MOCK_HOME_FEEDS: FeedData[] = [
  {
    id: 'home-1',
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST, MOCK_POST, MOCK_POST],
    caption: LONG_CAPTION,
    likeCount: 128,
    commentCount: 24,
  },
  {
    id: 'home-2',
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST, MOCK_POST],
    caption: '내용내용내용내용내용내용내용내용내용내용 #royalcanin',
    likeCount: 56,
    commentCount: 8,
  },
  {
    id: 'home-3',
    nickname: 'HAN_HOSEONGS',
    profileUrl: MOCK_PROFILE,
    images: [MOCK_POST],
    caption: '산책 후 간식 타임 #푸들 #royalcanin',
    likeCount: 12,
    commentCount: 3,
  },
];
export const MOCK_MY_FEEDS: FeedData[] = Array.from({ length: 9 }, (_, i) => ({
  id: `feed-${i + 1}`,
  nickname: 'HAN_HOSEONGS',
  profileUrl: MOCK_PROFILE,
  images: i % 3 === 0 ? [MOCK_POST, MOCK_POST, MOCK_POST] : [MOCK_POST],
  caption: LONG_CAPTION,
  likeCount: 10 + i * 7,
  commentCount: 2 + i,
}));

export const MOCK_SAVED_FEEDS: FeedData[] = Array.from({ length: 6 }, (_, i) => ({
  id: `saved-${i + 1}`,
  nickname: 'HAN_HOSEONGS',
  profileUrl: MOCK_PROFILE,
  images: i % 2 === 0 ? [MOCK_POST, MOCK_POST] : [MOCK_POST],
  caption: '저장한 게시글 내용내용내용내용내용내용 #royalcanin',
  likeCount: 20 + i * 5,
  commentCount: 1 + i * 2,
}));

/** 검색 페이지 추천 게시글 */
export const MOCK_RECOMMENDED_FEEDS: FeedData[] = Array.from({ length: 9 }, (_, i) => ({
  id: `rec-${i + 1}`,
  nickname: 'HAN_HOSEONGS',
  profileUrl: MOCK_PROFILE,
  images: [MOCK_POST, MOCK_POST],
  caption: LONG_CAPTION,
  likeCount: 30 + i * 3,
  commentCount: i + 1,
}));
