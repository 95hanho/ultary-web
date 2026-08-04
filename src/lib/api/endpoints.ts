/**
 * BE(Ultary API)에 현재 구현된 엔드포인트만 정의.
 * baseURL(예: http://localhost:9377)은 호출부에서 붙인다.
 */
export const endpoints = {
  health: {
    /** GET — 서버 생존 확인. data: "OK" */
    check: '/api/v1/health',
    /** GET — DB 연결 확인. data: "DB_OK" */
    db: '/api/v1/health/db',
  },
  auth: {
    /** POST LoginRequest → TokenResponse */
    login: '/api/v1/auth/login',
    /** POST RefreshTokenRequest → TokenResponse */
    refresh: '/api/v1/auth/refresh',
    /** POST — Authorization: Bearer {accessToken} */
    logout: '/api/v1/auth/logout',
    /** GET MeResponse — Authorization: Bearer {accessToken} */
    me: '/api/v1/auth/me',
  },
} as const;

export type Endpoints = typeof endpoints;
