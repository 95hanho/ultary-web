# Ultary BFF 문서

Next.js Route Handler(`/api/**`)가 브라우저와 Spring Boot(`ultary-api`) 사이의 **BFF(Backend For Frontend)** 역할을 한다.

## 문서 구성

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 요청 흐름, 인증, 응답 규약, 디렉터리 구조 |
| [api-spec.md](./api-spec.md) | BFF API 명세 (Spring 매핑·인증·구현 상태) |
| [development.md](./development.md) | Route Handler 구현 가이드 |
| [../api-memo.md](../api-memo.md) | 도메인별 엔드포인트 빠른 참조 (원본 SoT) |

## 코드·테스트 위치

| 용도 | 경로 |
|------|------|
| BFF Route Handler | `src/app/api/**/route.ts` |
| 엔드포인트 상수 | `src/lib/api/endpoints.ts` |
| 브라우저 → BFF | `src/lib/api/bffFetch.ts` |
| BFF → Spring | `src/lib/api/springFetch.ts` |
| 타입 | `src/types/**` |
| REST Client | `http/bff.http` |

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # SPRING_BASE_URL, OAuth 키 등
npm run dev
```

- BFF: `http://localhost:3000/api/**`
- Spring: `SPRING_BASE_URL` (기본 `http://localhost:9377`)

## 구현 현황 (요약)

| 구분 | 상태 |
|------|------|
| 인증 (login/refresh/logout/me/signup/phone) | ✅ Spring 연동 |
| 소셜 OAuth (Google/Kakao 시작·콜백) | ✅ Spring 연동 |
| 그 외 도메인 (main, feed, pet, tag …) | 🚧 스켈레톤 (501) |

상세 목록은 [api-spec.md](./api-spec.md) 참고.
