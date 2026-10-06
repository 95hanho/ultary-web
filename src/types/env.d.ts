declare namespace NodeJS {
  interface ProcessEnv {
    /** 브라우저 → Next BFF. 같은 오리진이면 빈 문자열 */
    NEXT_PUBLIC_BFF_BASE_URL?: string;
    /** 공개 앱 URL (리다이렉트 안내용) */
    NEXT_PUBLIC_APP_URL?: string;
    /** 브라우저 웹소켓. 없으면 ws://localhost:9377/api/v1/ws */
    NEXT_PUBLIC_SPRING_WS_URL?: string;
    /** Next 서버 → Spring */
    SPRING_BASE_URL?: string;
    /** OAuth redirect / 절대 URL용 */
    APP_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    KAKAO_REST_API_KEY?: string;
    KAKAO_CLIENT_SECRET?: string;
  }
}

export {};
