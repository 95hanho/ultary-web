/** 브라우저에서 보이는 공개 env만 */
/** DEV 도구 표시 여부. 실행 모드와 별개이며 명시적으로 true인 경우에만 표시한다. */
export const ENABLE_DEV_TOOLS = process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

/** Cafe24 운영 환경은 웹소켓 미사용. 로컬 개발은 기본 활성화한다. */
export const ENABLE_WEBSOCKET =
  process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true' ||
  (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET == null && process.env.NODE_ENV === 'development');

export const BFF_BASE_URL = process.env.NEXT_PUBLIC_BFF_BASE_URL ?? '';
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** 브라우저 → Spring 웹소켓. Next를 거치지 않는다. */
export const SPRING_WS_URL =
  process.env.NEXT_PUBLIC_SPRING_WS_URL ?? 'ws://localhost:9377/api/v1/ws';
