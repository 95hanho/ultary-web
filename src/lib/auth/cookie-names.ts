/** 쿠키 이름 — Edge middleware / Node 공용 (server-only 금지) */
export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

/** access 기본 30분 */
export const ACCESS_TOKEN_MAX_AGE = 60 * 30;
/** refresh 기본 14일 */
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 14;
