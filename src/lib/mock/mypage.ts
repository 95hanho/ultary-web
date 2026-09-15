/** 마이페이지 mock 프로필 */

export type MockMyProfile = {
  name: string;
  nickname: string;
  email: string;
  /** 숫자만 */
  phone: string;
  regionSido: string;
  regionSigungu: string;
};

export const MOCK_MY_PROFILE: MockMyProfile = {
  name: '한호성',
  nickname: 'HAN_HOSEONGS',
  email: 'hosung6674@naver.com',
  phone: '01085546674',
  regionSido: '경기도',
  regionSigungu: '용인시',
};

/** 010-1234-5678 형태 표시 */
export function formatPhoneDisplay(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/** 시/도 + 시/군/구 공백 결합 */
export function formatRegionDisplay(sido: string, sigungu: string) {
  const s = sido.trim();
  const g = sigungu.trim();
  if (!s || s === '선택 없음') return '선택 없음';
  if (!g || g === '선택 없음') return s;
  return `${s} ${g}`;
}
