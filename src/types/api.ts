/** BE ApiResponse / ProblemDetail 대응 */

export const API_ERROR_CODES = [
  'INTERNAL_SERVER_ERROR',
  'INVALID_INPUT',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'DB_CONNECTION_FAILED',
  'LOGIN_FAILED',
  'USER_INACTIVE',
  'TOKEN_EXPIRED',
  'INVALID_TOKEN',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** BE 성공 응답 ApiResponse<T> */
export type ApiResponse<T> = {
  success: true;
  code: 'OK';
  message: string;
  data: T | null;
  timestamp: string;
};

/** BE 실패 응답 RFC7807 ProblemDetail (+ code extension) */
export type ApiProblemDetail = {
  type?: string;
  title?: string;
  status: number;
  detail: string;
  instance?: string;
  code: ApiErrorCode;
  /** INVALID_INPUT 시 필드별 메시지 */
  errors?: Record<string, string>;
};

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === 'string' &&
    (API_ERROR_CODES as readonly string[]).includes(value)
  );
}

export function isApiProblemDetail(value: unknown): value is ApiProblemDetail {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const body = value as Record<string, unknown>;
  return typeof body.status === 'number' && isApiErrorCode(body.code);
}

export type SocialProvider = 'GOOGLE' | 'KAKAO';

/** POST /api/v1/auth/login — email 또는 phone + password */
export type LoginRequest = {
  email?: string;
  phone?: string;
  password: string;
};

/** POST /api/v1/auth/signup */
export type SignupRequest = {
  phoneAuthCompleteToken: string;
  password: string;
  nickname: string;
  name?: string | null;
  email?: string | null;
};

/** POST /api/v1/auth/phone */
export type PhoneAuthRequest = {
  phone: string;
};

export type PhoneAuthResponse = {
  phoneAuthToken: string;
};

/** POST /api/v1/auth/phone/verify */
export type PhoneVerifyRequest = {
  code: string;
  phoneAuthToken: string;
};

export type PhoneVerifyResponse = {
  phoneAuthCompleteToken: string;
};

/** POST /api/v1/auth/refresh */
export type RefreshTokenRequest = {
  refreshToken: string;
};

/** login / refresh / social/login 공통 토큰 필드 */
export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
  expiresIn: number;
};

/** POST /api/v1/auth/social/login · social/link */
export type SocialLoginRequest = {
  provider: SocialProvider;
  providerUserId: string;
  email?: string | null;
  name?: string | null;
};

/** POST /api/v1/auth/social/login 성공 data */
export type SocialLoginResponse = TokenResponse & {
  newUser: boolean;
  defaultNickname: boolean;
};

/** PATCH /api/v1/auth/me */
export type UpdateMeRequest = {
  name?: string | null;
  nickname?: string;
  bio?: string | null;
  regionSido?: string | null;
  regionSigungu?: string | null;
  profileFileId?: number | null;
};

/** GET /api/v1/auth/me 성공 data */
export type MeResponse = {
  userNo: number;
  name: string | null;
  nickname: string;
  defaultNickname: boolean;
  hasPassword: boolean;
  email: string | null;
  phone: string | null;
  profileFileId: number | null;
  bio: string | null;
  regionSido: string | null;
  regionSigungu: string | null;
  withdrawalStatus: 'ACTIVE' | 'REQUESTED' | 'WITHDRAWN';
  createdAt: string;
};
