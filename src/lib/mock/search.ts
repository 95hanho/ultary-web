export type SearchAccount = {
  id: string;
  nickname: string;
  imageUrl: string;
  petTags: string[];
};

const PROFILE = '/images/mock/profile.jpg';

/** 검색용 계정 목업 */
export const MOCK_SEARCH_ACCOUNTS: SearchAccount[] = [
  {
    id: 'acc-1',
    nickname: 'HAN_HOSEONGS',
    imageUrl: PROFILE,
    petTags: ['@choco_01', '@mocha_02', '@vanilla_03', '@cookie_04', '@peanut_05'],
  },
  {
    id: 'acc-2',
    nickname: 'O_JEONGTEAK',
    imageUrl: PROFILE,
    petTags: ['@han_01', '@momo_02', '@tori_03'],
  },
  {
    id: 'acc-3',
    nickname: 'LEE_OKJU',
    imageUrl: PROFILE,
    petTags: ['@choco_lee', '@daisy_01'],
  },
  {
    id: 'acc-4',
    nickname: 'KIM_PUPPY',
    imageUrl: PROFILE,
    petTags: ['@poodle_01', '@poodle_02'],
  },
];

/** 해시태그 목업 */
export const MOCK_HASHTAGS = [
  '#푸들',
  '#푸들그램',
  '#푸들스타그램',
  '#푸들미용',
  '#푸들산책',
  '#푸들일상',
  '#고양이',
  '#강아지',
  '#산책',
];
