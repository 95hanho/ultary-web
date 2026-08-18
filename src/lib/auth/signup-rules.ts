/** 회원가입 FE 검증·필터 */

export const PHONE_RE = /^01[0-9]{8,9}$/;
export const PASSWORD_RE =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|;:'",.<>/?~`\\]).{8,100}$/;
/** 허용 문자만. 길이는 한글=2, 영문=1 가중치로 별도 검사 */
export const NICKNAME_RE = /^[A-Za-z가-힣]+$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MSG = {
  phoneRequired: '연락처를 입력해주세요.',
  phone: '휴대폰 번호 형식이 올바르지 않습니다.',
  emailRequired: '이메일을 입력해주세요.',
  email: '이메일 형식이 올바르지 않습니다.',
  passwordRequired: '비밀번호를 입력해주세요.',
  password:
    '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.',
  passwordConfirm: '비밀번호가 일치하지 않습니다.',
  nameRequired: '이름을 입력해주세요.',
  nicknameRequired: '닉네임을 입력해주세요.',
  nickname:
    '닉네임은 한글 2~5자 또는 영문 4~10자입니다. 섞어 쓸 때는 한글 1자를 2자로 계산해 합 10자를 넘을 수 없습니다.',
  sidoRequired: '지역 시/도를 선택해주세요.',
  sigunguRequired: '지역 시/군/구를 선택해주세요.',
  phoneAuth: '휴대폰 인증을 완료해주세요.',
  code: '인증번호를 입력해주세요.',
} as const;

/** 숫자만, 최대 11자 */
export function filterPhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

/** 인증번호: 숫자만 6자 */
export function filterCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

function isHangulChar(ch: string) {
  return /[가-힣]/.test(ch);
}

/** 한글 1자 = 2, 영문 1자 = 1 */
export function nicknameWeight(value: string) {
  let weight = 0;
  for (const ch of value) {
    weight += isHangulChar(ch) ? 2 : 1;
  }
  return weight;
}

/** 닉네임: 영문·한글만, 가중치 합 10 이하 (제출 시 검사) */
export function filterNickname(value: string) {
  return value.replace(/[^A-Za-z가-힣]/g, '');
}

/** 이름: 최대 20자 */
export function filterName(value: string) {
  return value.slice(0, 20);
}

/** 이메일: 최대 50자 */
export function filterEmail(value: string) {
  return value.slice(0, 50);
}

export function validatePhone(phone: string) {
  if (!phone.trim()) return MSG.phoneRequired;
  return PHONE_RE.test(phone) ? null : MSG.phone;
}

export function validateEmail(email: string) {
  if (!email.trim()) return MSG.emailRequired;
  return EMAIL_RE.test(email) ? null : MSG.email;
}

export function validatePassword(password: string) {
  if (!password) return MSG.passwordRequired;
  return PASSWORD_RE.test(password) ? null : MSG.password;
}

export function validateNickname(nickname: string) {
  if (!NICKNAME_RE.test(nickname)) return MSG.nickname;

  const hangul = [...nickname].filter(isHangulChar).length;
  const english = nickname.length - hangul;
  const weight = hangul * 2 + english;

  if (hangul > 0 && english === 0) {
    return hangul >= 2 && hangul <= 5 ? null : MSG.nickname;
  }
  if (english > 0 && hangul === 0) {
    return english >= 4 && english <= 10 ? null : MSG.nickname;
  }
  return weight >= 4 && weight <= 10 ? null : MSG.nickname;
}
