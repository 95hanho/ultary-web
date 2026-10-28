/** 회원가입 FE 검증·필터 */

export const PHONE_RE = /^01[0-9]{8,9}$/;
export const PASSWORD_RE =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|;:'",.<>/?~`\\]).{8,100}$/;
/** 닉네임태그 본문: 영문 소문자와 밑줄 1~10자 */
export const NICKNAME_RE = /^[a-z_]{1,10}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MSG = {
  phoneRequired: '연락처를 입력해주세요.',
  phone: '휴대폰 번호 형식이 올바르지 않습니다.',
  emailRequired: '이메일을 입력해주세요.',
  email: '이메일 형식이 올바르지 않습니다.',
  passwordRequired: '비밀번호를 입력해주세요.',
  password: '비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.',
  passwordConfirm: '비밀번호가 일치하지 않습니다.',
  nameRequired: '이름을 입력해주세요.',
  nicknameRequired: '닉네임태그를 입력해주세요.',
  nickname: '닉네임태그는 영문 소문자와 밑줄(_)만 사용해 1~10자로 입력해주세요.',
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

/** 닉네임태그 입력: @는 화면에 표시하고 영문은 소문자로 정규화한다. */
export function filterNickname(value: string) {
  return value
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z_]/g, '')
    .slice(0, 10);
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
  return NICKNAME_RE.test(nickname) ? null : MSG.nickname;
}
