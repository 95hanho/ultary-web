import { isHttpError, isRecord } from '@/lib/api/error';

const FIELD_MAP: Record<string, string> = {
  phone: 'phone',
  phoneAuthCompleteToken: 'phone',
  email: 'email',
  password: 'password',
  nickname: 'nickname',
  name: 'name',
  regionSido: 'regionSido',
  regionSigungu: 'regionSigungu',
};

/** Signup validation/business failures belong beside their input; transport failures remain form-wide. */
export function signupFieldErrors(error: unknown): Record<string, string> {
  if (!isHttpError(error) || !isRecord(error.data)) return {};
  const payload = error.data;
  const code = payload.code ?? payload.message;
  const duplicate: Record<string, [string, string]> = {
    PHONE_ALREADY_USED: ['phone', '이미 가입된 휴대폰 번호입니다.'],
    NICKNAME_DUPLICATED: ['nickname', '이미 사용 중인 닉네임입니다.'],
    EMAIL_DUPLICATED: ['email', '이미 사용 중인 이메일입니다.'],
  };
  if (typeof code === 'string' && duplicate[code]) {
    const [field, message] = duplicate[code];
    return { [field]: message };
  }
  const result: Record<string, string> = {};
  if (code === 'INVALID_INPUT' && isRecord(payload.data)) {
    for (const [field, message] of Object.entries(payload.data)) {
      if (FIELD_MAP[field] && typeof message === 'string') result[FIELD_MAP[field]] = message;
    }
  }
  return result;
}
