export type SearchAccount = {
  id: string;
  nickname: string;
  imageUrl: string;
  petTags: string[];
};

export type MockHashtag = {
  /** `#` 포함 */
  tag: string;
  postCount: number;
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
export const MOCK_HASHTAGS: MockHashtag[] = [
  { tag: '#푸들', postCount: 1250 },
  { tag: '#푸들그램', postCount: 320 },
  { tag: '#푸들스타그램', postCount: 15 },
  { tag: '#푸들미용', postCount: 12500 },
  { tag: '#푸들산책', postCount: 84 },
  { tag: '#푸들일상', postCount: 3 },
  { tag: '#고양이', postCount: 5400 },
  { tag: '#강아지', postCount: 21000 },
  { tag: '#산책', postCount: 890 },
];

/** `1000+ POST` / `15 POST` 표기 */
export function formatTagPostCount(count: number): string {
  if (count >= 1000) return `${Math.floor(count / 1000) * 1000}+ POST`;
  if (count >= 100) return `${Math.floor(count / 100) * 100}+ POST`;
  return `${count} POST`;
}

export function filterMockHashtags(term: string): MockHashtag[] {
  const q = term.trim().toLowerCase().replace(/^#/, '');
  if (!q) return [];
  return MOCK_HASHTAGS.filter((item) => {
    const name = item.tag.toLowerCase();
    return name.includes(q) || name.includes(`#${q}`);
  });
}

/** 닉네임·펫언급 검색 (`#` 해시태그는 대상 아님) */
export function filterMockAccounts(
  term: string,
  mode: 'plain' | 'pet' = 'plain',
): SearchAccount[] {
  const q = term.trim().toLowerCase().replace(/^@/, '');
  if (!q) return [];

  return MOCK_SEARCH_ACCOUNTS.filter((acc) => {
    if (mode === 'pet') {
      return acc.petTags.some(
        (tag) => tag.toLowerCase().includes(`@${q}`) || tag.toLowerCase().includes(q),
      );
    }
    const nickHit = acc.nickname.toLowerCase().includes(q);
    const tagHit = acc.petTags.some((tag) => tag.toLowerCase().includes(q));
    return nickHit || tagHit;
  });
}
