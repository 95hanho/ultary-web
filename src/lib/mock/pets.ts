/** 반려동물 관리 mock */

export type ManagedPet = {
  id: string;
  name: string;
  /** @ 없이 저장, 표시 시 @ 붙임 */
  tag: string;
  gender: 'M' | 'F';
  bio: string;
  birth: string;
  imageUrl: string;
};

export const MOCK_MANAGED_PETS: ManagedPet[] = [
  {
    id: 'pet-1',
    name: '초코',
    tag: 'choco_01',
    gender: 'M',
    bio: '산책 좋아함',
    birth: '1995-08-14',
    imageUrl: '/images/mock/profile.jpg',
  },
  {
    id: 'pet-2',
    name: '모카',
    tag: 'mocha_02',
    gender: 'F',
    bio: '낮잠 전문',
    birth: '2018-03-22',
    imageUrl: '/images/mock/profile.jpg',
  },
  {
    id: 'pet-3',
    name: '바닐라',
    tag: 'vanilla_03',
    gender: 'F',
    bio: '간식 러버',
    birth: '2020-11-05',
    imageUrl: '/images/mock/profile.jpg',
  },
];
