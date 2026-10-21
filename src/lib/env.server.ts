/** 서버 전용 env */
import 'server-only';

export const SPRING_BASE_URL = process.env.SPRING_BASE_URL ?? '';
/** BFF→Spring 서버 전용. NEXT_PUBLIC_ 변수로 만들지 않는다. */
export const BFF_INTERNAL_KEY = process.env.BFF_INTERNAL_KEY ?? '';

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
