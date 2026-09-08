/** 마이울타리 mock 계정 (URL: /myultary/[nickname]) */

export type UltaryStoryStatus = 'none' | 'read' | 'unread';

export type UltaryAccount = {
  nickname: string;
  postCount: number;
  residentCount: number;
  neighborCount: number;
  bio: string;
  storyStatus: UltaryStoryStatus;
  /** 로그인한 내 계정인지 (mock) */
  isOwnAccount: boolean;
};

/** 로그인 유저 닉네임 (푸터·리다이렉트용) */
export const MY_NICKNAME = 'HAN_HOSEONGS';

/** 다른 사람 울타리 예시 */
export const OTHER_NICKNAME = 'LEE_OKJU';

const ACCOUNTS: Record<string, UltaryAccount> = {
  [MY_NICKNAME]: {
    nickname: MY_NICKNAME,
    postCount: 4,
    residentCount: 125,
    neighborCount: 128,
    bio: '오늘 공유한 나의 울타리 동물',
    storyStatus: 'unread',
    isOwnAccount: true,
  },
  [OTHER_NICKNAME]: {
    nickname: OTHER_NICKNAME,
    postCount: 12,
    residentCount: 48,
    neighborCount: 210,
    bio: '이웃들과 함께하는 반려일상',
    storyStatus: 'read',
    isOwnAccount: false,
  },
};

export function getUltaryAccount(nickname: string): UltaryAccount | null {
  return ACCOUNTS[nickname] ?? null;
}

export function myUltaryPath(nickname: string = MY_NICKNAME) {
  return `/myultary/${nickname}`;
}
