export type MockStoryItem = {
  id: string;
  kind: 'image' | 'video';
  src: string;
};

export type MockStoryOwner = {
  userNo: string;
  nickname: string;
  profileUrl: string;
  items: MockStoryItem[];
};

/** 스토리 뷰어 미리보기 목업 */
export const MOCK_STORY_OWNER: MockStoryOwner = {
  userNo: '1',
  nickname: 'HAN_HOSEONGS',
  profileUrl: '/images/mock/profile.jpg',
  items: [
    {
      id: 'story-1',
      kind: 'image',
      src: '/images/mock/post_ex.jpg',
    },
    {
      id: 'story-2',
      kind: 'image',
      src: '/images/mock/feed.jpg',
    },
    {
      id: 'story-3',
      kind: 'image',
      src: '/images/mock/profile.jpg',
    },
  ],
};

export const STORY_IMAGE_DURATION_MS = 5000;
