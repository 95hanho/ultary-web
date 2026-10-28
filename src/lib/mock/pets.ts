/** 반려동물 관리 mock */

export type ManagedPet = {
  id: string;
  name: string;
  gender: 'M' | 'F' | '?';
  bio: string;
  birth: string;
  imageUrl: string;
  /** 작을수록 위. 화면 순서와 맞춘다 */
  priority: number;
};

export const MOCK_MANAGED_PETS: ManagedPet[] = [
  {
    id: 'pet-1',
    name: '초코',
    gender: 'M',
    bio: '산책 좋아함',
    birth: '1995-08-14',
    imageUrl: '/images/mock/profile.jpg',
    priority: 1,
  },
  {
    id: 'pet-2',
    name: '모카',
    gender: 'F',
    bio: '낮잠 전문',
    birth: '2018-03-22',
    imageUrl: '/images/mock/profile.jpg',
    priority: 2,
  },
  {
    id: 'pet-3',
    name: '바닐라',
    gender: 'F',
    bio: '간식 러버',
    birth: '2020-11-05',
    imageUrl: '/images/mock/profile.jpg',
    priority: 3,
  },
];
