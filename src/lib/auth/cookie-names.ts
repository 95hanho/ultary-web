/** 쿠키 이름 — proxy / Node 공용 (server-only 금지) */
export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

/**
 * development 전용. 액세스 토큰 값 없이 예상 만료 시각만 담는다.
 * httpOnly가 아니라 개발 패널이 읽는다.
 */
export const DEV_ACCESS_EXPIRES_AT_COOKIE = 'devAccessExpiresAt';
export const DEV_ACCESS_ISSUED_AT_COOKIE = 'devAccessIssuedAt';
export const DEV_ACCESS_VIA_REFRESH_COOKIE = 'devAccessViaRefresh';

/** access 기본 30분 */
export const ACCESS_TOKEN_MAX_AGE = 60 * 30;
/** refresh 기본 14일 */
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 14;
