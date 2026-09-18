/** DM mock */

export type MockDmMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  timeLabel: string;
};

export type MockDmRoom = {
  id: string;
  nickname: string;
  profileUrl: string;
  lastMessage: string;
  timeLabel: string;
  unread: number;
  messages: MockDmMessage[];
};

const PROFILE = '/images/mock/feed.jpg';
const PROFILE_2 = '/images/mock/post_ex.jpg';

export const MOCK_DM_ROOMS: MockDmRoom[] = [
  {
    id: 'dm-1',
    nickname: 'LEE_OKJU',
    profileUrl: PROFILE_2,
    lastMessage: '다음에 산책 같이 가요!',
    timeLabel: '방금',
    unread: 2,
    messages: [
      {
        id: 'm1',
        fromMe: false,
        text: '안녕하세요! 울타리에서 봤어요.',
        timeLabel: '어제 18:20',
      },
      {
        id: 'm2',
        fromMe: true,
        text: '안녕하세요 :) 반갑습니다.',
        timeLabel: '어제 18:22',
      },
      {
        id: 'm3',
        fromMe: false,
        text: '다음에 산책 같이 가요!',
        timeLabel: '방금',
      },
    ],
  },
  {
    id: 'dm-2',
    nickname: 'mina_walk',
    profileUrl: PROFILE,
    lastMessage: '코코 너무 귀여워요',
    timeLabel: '1시간',
    unread: 0,
    messages: [
      {
        id: 'm4',
        fromMe: false,
        text: '코코 너무 귀여워요',
        timeLabel: '1시간',
      },
      {
        id: 'm5',
        fromMe: true,
        text: '감사해요!',
        timeLabel: '50분',
      },
    ],
  },
  {
    id: 'dm-3',
    nickname: 'park_june',
    profileUrl: PROFILE_2,
    lastMessage: '사진 구도 팁 알려주셔서 감사해요',
    timeLabel: '어제',
    unread: 0,
    messages: [
      {
        id: 'm6',
        fromMe: false,
        text: '사진 구도 팁 알려주셔서 감사해요',
        timeLabel: '어제',
      },
    ],
  },
];
