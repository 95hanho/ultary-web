/** 브라우저에서 보이는 공개 env만 */
export const BFF_BASE_URL = process.env.NEXT_PUBLIC_BFF_BASE_URL ?? '';
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/** 브라우저 → Spring 웹소켓. Next를 거치지 않는다. */
export const SPRING_WS_URL =
  process.env.NEXT_PUBLIC_SPRING_WS_URL ?? 'ws://localhost:9377/api/v1/ws';
