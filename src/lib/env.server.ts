/** 서버 전용 env */

export const SPRING_BASE_URL = process.env.SPRING_BASE_URL ?? '';

/** 앱 오리진 (OAuth redirect용) */
export const APP_URL =
  process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const isProd = process.env.NODE_ENV === 'production';

/** Google OAuth (Authorization Code) */
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';

/** Kakao OAuth — REST API 키 = client_id */
export const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY ?? '';
export const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET ?? '';
