# BFF 아키텍처

## 요청 흐름

```
브라우저 (React)
    │  bffFetch  — JSON, credentials: include (쿠키)
    ▼
Next.js Route Handler  /api/**
    │  springFetch — form / multipart / (예외) JSON
    │  Authorization: Bearer {accessToken}  (쿠키에서 꺼냄)
    ▼
Spring Boot  /api/v1/**
    │
    ▼
MariaDB
```

### 역할 분담

| 계층 | 책임 |
|------|------|
| **브라우저** | UI, `bffFetch`로 BFF만 호출. JWT를 직접 다루지 않음 |
| **BFF** | OAuth 처리, httpOnly 쿠키, Spring 프록시, FE 친화 응답 |
| **Spring** | 비즈니스 로직, DB, JWT 발급·검증 |

BFF가 Spring을 대신하는 경우:

- Google/Kakao OAuth Authorization Code 교환
- 로그인·refresh 성공 시 `accessToken`/`refreshToken`을 httpOnly 쿠키로 저장
- 로그아웃·탈퇴 시 쿠키 삭제

## 인증

### 쿠키

| 이름 | 용도 | 기본 maxAge |
|------|------|-------------|
| `accessToken` | Spring API Bearer | 30분 (`expiresIn` 우선) |
| `refreshToken` | 토큰 재발급 | 14일 |

설정: `src/lib/auth/cookies.ts` — `httpOnly`, `sameSite: lax`, prod에서 `secure`.

### 인증 필요 API

BFF Route Handler에서:

1. `getAccessToken()`으로 쿠키 읽기
2. 없으면 `401` 반환
3. Spring 호출 시 `Authorization: Bearer {accessToken}` 헤더

토큰 재발급은 `POST /api/auth/refresh` — refresh 쿠키 → Spring refresh → 쿠키 갱신.

### 소셜 로그인

```
GET /api/auth/social/{google|kakao}
  → OAuth authorize redirect + state 쿠키

GET /api/auth/social/{provider}/callback?code=&state=
  → code 교환 → POST /api/v1/auth/social/login
  → setAuthCookies → 앱 페이지 redirect
```

Redirect URI (로컬):

- `http://localhost:3000/api/auth/social/google/callback`
- `http://localhost:3000/api/auth/social/kakao/callback`

## 응답 규약

### BFF → 브라우저

**성공 (일반)**

```json
{ "success": true, "data": { ... } }
```

로그인·refresh처럼 토큰을 쿠키에만 넣는 경우:

```json
{ "success": true, "message": "LOGIN_SUCCESS" }
```

**실패**

Spring `ProblemDetail`을 그대로 전달하거나, BFF 검증 실패 시:

```json
{ "message": "INVALID_INPUT", "detail": "..." }
```

**미구현**

```json
{
  "success": false,
  "code": "NOT_IMPLEMENTED",
  "message": "pets GET is not implemented yet",
  "data": null
}
```

HTTP **501**

### Spring → BFF (업스트림)

**성공:** `ApiResponse<T>` — `springFetch`가 `data`만 unwrap

```json
{
  "success": true,
  "code": "OK",
  "message": "...",
  "data": { ... },
  "timestamp": "..."
}
```

**실패:** RFC 7807 `ProblemDetail` + `code` extension → `handleBffError`로 BFF 응답 변환

## Content-Type

| 방향 | 기본 | 예외 |
|------|------|------|
| 브라우저 → BFF | `application/json` | 파일 업로드 시 `multipart/form-data` |
| BFF → Spring | `application/x-www-form-urlencoded`, `multipart/form-data` | auth 등 JSON 필요 엔드포인트: `springPostJson` / `springPatchJson` |

## 디렉터리 구조

```
src/
  app/api/              # Route Handler (= BFF 엔드포인트)
  lib/api/
    endpoints.ts        # bffEndpoints / springEndpoints
    bffFetch.ts         # 클라이언트용
    springFetch.ts      # 서버 → Spring
    bffRoute.ts         # notImplemented, handleBffError
    http.ts             # 공통 fetch 유틸
  lib/auth/             # 쿠키, OAuth
  types/                # Request/Response 타입
http/
  bff.http              # REST Client 수동 테스트
docs/
  bff/                  # 이 문서
  api-memo.md           # 엔드포인트 SoT (FE ↔ BE 공유)
```

## 환경 변수

`.env.local.example` 참고.

| 변수 | 용도 |
|------|------|
| `SPRING_BASE_URL` | BFF → Spring 베이스 URL |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | OAuth redirect |
| `NEXT_PUBLIC_BFF_BASE_URL` | 클라이언트 bffFetch (같은 오리진이면 비움) |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth |
| `KAKAO_REST_API_KEY/CLIENT_SECRET` | Kakao OAuth |

## 원본 정의 (Source of Truth)

Spring `/api/v1/**` 경로·Method의 **원본 정의**는 이 FE 레포를 따른다.

- `docs/api-memo.md`
- `src/lib/api/endpoints.ts` → `springEndpoints`

BE(`ultary-api`) Controller는 위와 동일해야 하며, 경로 변경 시 FE를 먼저 수정한 뒤 BE를 맞춘다.
