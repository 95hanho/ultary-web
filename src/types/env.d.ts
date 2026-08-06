declare namespace NodeJS {
  interface ProcessEnv {
    /** 브라우저 → Next BFF. 같은 오리진이면 빈 문자열 */
    NEXT_PUBLIC_BFF_BASE_URL?: string;
    /** Next 서버 → Spring */
    SPRING_BASE_URL?: string;
  }
}

export {};
