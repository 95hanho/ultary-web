/**
 * 엔드포인트 경로 모음.
 *
 * - bffEndpoints   : 브라우저 → Next Route Handler
 * - springEndpoints: Next 서버 → Spring
 */

/** 브라우저 → Next BFF 경로 (Route Handler 추가 시 여기에 맞춤) */
export const bffEndpoints = {
  auth: {
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  health: {
    check: '/api/health',
  },
} as const;

/** Next 서버 → Spring 경로 */
export const springEndpoints = {
  health: {
    /** GET — 서버 생존 확인. data: "OK" */
    check: '/api/v1/health',
    /** GET — DB 연결 확인. data: "DB_OK" */
    db: '/api/v1/health/db',
  },
  auth: {
    /** POST LoginRequest → TokenResponse (현재 BE는 JSON) */
    login: '/api/v1/auth/login',
    /** POST RefreshTokenRequest → TokenResponse */
    refresh: '/api/v1/auth/refresh',
    /** POST — Authorization: Bearer {accessToken} */
    logout: '/api/v1/auth/logout',
    /** GET MeResponse — Authorization: Bearer {accessToken} */
    me: '/api/v1/auth/me',
  },
} as const;

export type BffEndpoints = typeof bffEndpoints;
export type SpringEndpoints = typeof springEndpoints;

/** @deprecated springEndpoints 사용 */
export const endpoints = springEndpoints;
export type Endpoints = SpringEndpoints;
