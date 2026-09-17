/** 피드 댓글·답글 mock (스크롤 테스트용으로 넉넉히) */

export type MockCommentReply = {
  id: string;
  nickname: string;
  profileUrl: string;
  content: string;
  timeLabel: string;
  likeCount: number;
  isLiked?: boolean;
};

export type MockComment = MockCommentReply & {
  replies: MockCommentReply[];
};

const PROFILE = '/images/mock/feed.jpg';
const PROFILE_2 = '/images/mock/post_ex.jpg';

const LONG =
  '내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용';

export const MOCK_FEED_COMMENTS: MockComment[] = [
  {
    id: 'c1',
    nickname: 'HAN_HOSEONGS',
    profileUrl: PROFILE,
    content: LONG,
    timeLabel: '6시간',
    likeCount: 305,
    isLiked: true,
    replies: [
      {
        id: 'r1',
        nickname: 'HAN_HOSEONGS',
        profileUrl: PROFILE,
        content: '@LEE_OKJU 내용내용내용내용내용내용내용내용내용내용내용내용내용',
        timeLabel: '6시간',
        likeCount: 305,
        isLiked: true,
      },
      {
        id: 'r2',
        nickname: 'HAN_HOSEONGS',
        profileUrl: PROFILE,
        content: '내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용내용',
        timeLabel: '6시간',
        likeCount: 0,
      },
      {
        id: 'r1b',
        nickname: 'LEE_OKJU',
        profileUrl: PROFILE_2,
        content: '@HAN_HOSEONGS 완전 공감해요 저도 그렇게 생각했어요',
        timeLabel: '5시간',
        likeCount: 18,
      },
      {
        id: 'r1c',
        nickname: 'kim_nari',
        profileUrl: PROFILE,
        content: '이 댓글 쓰레드 길어서 스크롤 테스트하기 좋음',
        timeLabel: '5시간',
        likeCount: 2,
      },
    ],
  },
  {
    id: 'c2',
    nickname: 'HAN_HOSEONGS',
    profileUrl: PROFILE,
    content: '오늘 산책 날씨 너무 좋았다',
    timeLabel: '3시간',
    likeCount: 12,
    replies: [
      {
        id: 'r3',
        nickname: 'LEE_OKJU',
        profileUrl: PROFILE_2,
        content: '@HAN_HOSEONGS 다음에 같이 가요!',
        timeLabel: '2시간',
        likeCount: 4,
      },
      {
        id: 'r3b',
        nickname: 'park_june',
        profileUrl: PROFILE,
        content: '@LEE_OKJU 저도 끼워주세요',
        timeLabel: '2시간',
        likeCount: 1,
      },
    ],
  },
  {
    id: 'c3',
    nickname: 'LEE_OKJU',
    profileUrl: PROFILE_2,
    content: '사진 구도 진짜 예쁘다 어디서 찍었어요?',
    timeLabel: '2시간',
    likeCount: 47,
    isLiked: true,
    replies: [
      {
        id: 'r4',
        nickname: 'HAN_HOSEONGS',
        profileUrl: PROFILE,
        content: '@LEE_OKJU 집 앞 공원이에요',
        timeLabel: '2시간',
        likeCount: 9,
      },
      {
        id: 'r5',
        nickname: 'mina_walk',
        profileUrl: PROFILE_2,
        content: '그 공원 저도 자주 가요 벤치 쪽 뷰가 특히 좋아요',
        timeLabel: '1시간',
        likeCount: 3,
      },
    ],
  },
  {
    id: 'c4',
    nickname: 'park_june',
    profileUrl: PROFILE,
    content: '울타리 피드 볼 때마다 힐링된다',
    timeLabel: '1시간',
    likeCount: 8,
    replies: [],
  },
  {
    id: 'c5',
    nickname: 'kim_nari',
    profileUrl: PROFILE_2,
    content: LONG,
    timeLabel: '58분',
    likeCount: 21,
    replies: [
      {
        id: 'r6',
        nickname: 'HAN_HOSEONGS',
        profileUrl: PROFILE,
        content: '@kim_nari 읽어주셔서 감사해요',
        timeLabel: '50분',
        likeCount: 5,
      },
      {
        id: 'r7',
        nickname: 'LEE_OKJU',
        profileUrl: PROFILE_2,
        content: '긴 글도 잘 읽히네요',
        timeLabel: '45분',
        likeCount: 0,
      },
      {
        id: 'r8',
        nickname: 'soo_bin',
        profileUrl: PROFILE,
        content: '@kim_nari ...더보기 테스트용으로도 좋아요',
        timeLabel: '40분',
        likeCount: 2,
      },
    ],
  },
  {
    id: 'c6',
    nickname: 'mina_walk',
    profileUrl: PROFILE,
    content: '강아지 표정이 너무 귀여워요',
    timeLabel: '40분',
    likeCount: 63,
    isLiked: true,
    replies: [
      {
        id: 'r9',
        nickname: 'HAN_HOSEONGS',
        profileUrl: PROFILE,
        content: '@mina_walk 우리 아이예요 ㅎㅎ',
        timeLabel: '38분',
        likeCount: 14,
      },
      {
        id: 'r10',
        nickname: 'mina_walk',
        profileUrl: PROFILE,
        content: '@HAN_HOSEONGS 이름 뭐예요?',
        timeLabel: '35분',
        likeCount: 1,
      },
      {
        id: 'r11',
        nickname: 'HAN_HOSEONGS',
        profileUrl: PROFILE,
        content: '@mina_walk 코코예요',
        timeLabel: '33분',
        likeCount: 7,
      },
    ],
  },
  {
    id: 'c7',
    nickname: 'soo_bin',
    profileUrl: PROFILE_2,
    content: '저장해두고 나중에 또 볼게요',
    timeLabel: '30분',
    likeCount: 4,
    replies: [],
  },
  {
    id: 'c8',
    nickname: 'yoon_hae',
    profileUrl: PROFILE,
    content: '이웃이면 인사하고 지나가겠습니다',
    timeLabel: '28분',
    likeCount: 11,
    replies: [
      {
        id: 'r12',
        nickname: 'HAN_HOSEONGS',
        profileUrl: PROFILE,
        content: '@yoon_hae 언제든 환영이에요',
        timeLabel: '25분',
        likeCount: 6,
      },
    ],
  },
  {
    id: 'c9',
    nickname: 'choi_dan',
    profileUrl: PROFILE_2,
    content: '태그 설명 눌러보는 재미가 있어요',
    timeLabel: '22분',
    likeCount: 9,
    replies: [
      {
        id: 'r13',
        nickname: 'park_june',
        profileUrl: PROFILE,
        content: '@choi_dan 저도 그거 신기했어요',
        timeLabel: '20분',
        likeCount: 2,
      },
      {
        id: 'r14',
        nickname: 'choi_dan',
        profileUrl: PROFILE_2,
        content: '@park_june 맞아요 한 번 보면 계속 보게 됨',
        timeLabel: '18분',
        likeCount: 0,
      },
    ],
  },
  {
    id: 'c10',
    nickname: 'HAN_HOSEONGS',
    profileUrl: PROFILE,
    content: '댓글 달아주신 분들 모두 감사해요',
    timeLabel: '15분',
    likeCount: 88,
    isLiked: true,
    replies: [
      {
        id: 'r15',
        nickname: 'LEE_OKJU',
        profileUrl: PROFILE_2,
        content: '@HAN_HOSEONGS 좋은 하루 보내세요',
        timeLabel: '12분',
        likeCount: 10,
      },
      {
        id: 'r16',
        nickname: 'kim_nari',
        profileUrl: PROFILE,
        content: '스크롤 끝 근처까지 왔는지 확인용',
        timeLabel: '10분',
        likeCount: 1,
      },
      {
        id: 'r17',
        nickname: 'mina_walk',
        profileUrl: PROFILE_2,
        content: '@kim_nari 여기까지 보이면 스크롤 OK',
        timeLabel: '8분',
        likeCount: 3,
      },
    ],
  },
  {
    id: 'c11',
    nickname: 'lee_tori',
    profileUrl: PROFILE,
    content: '마지막에서 두 번째 댓글입니다',
    timeLabel: '5분',
    likeCount: 2,
    replies: [],
  },
  {
    id: 'c12',
    nickname: 'jung_woo',
    profileUrl: PROFILE_2,
    content: '여기가 맨 아래예요 스크롤 테스트 완료',
    timeLabel: '1분',
    likeCount: 0,
    replies: [
      {
        id: 'r18',
        nickname: 'HAN_HOSEONGS',
        profileUrl: PROFILE,
        content: '@jung_woo 확인 감사합니다',
        timeLabel: '방금',
        likeCount: 1,
      },
    ],
  },
];
