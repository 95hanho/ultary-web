# 페이지·API 인증 접근 규칙

Spring REST API는 사용자 JWT와 별개로 BFF 공유 키를 확인한다. 브라우저는 키 없이 Next BFF를 호출하고, BFF만 `X-BFF-Key`를 Spring에 전달한다. 공개 API·공유 피드도 이 서버 인증을 통과해야 한다. [`bff-server-auth.md`](./bff-server-auth.md) 참고.

> 상태: **FE/BFF 1차 적용** · Spring은 [`spring-auth-api.md`](./spring-auth-api.md)  
> 대상: FE(페이지·모달) · BFF · Spring (공개 단건 피드 등)

---

## 1. 기본 원칙

| 구분 | 비로그인 | 로그인 |
|------|----------|--------|
| 인증 제외 페이지 (로그인·회원가입 등) | 접근 가능 | 접근 가능 |
| **그 외 모든 페이지** | **로그인 페이지로 이동** (`/login`) | 정상 |
| **공개 울타리** `/myultary/:nickname` | 공개 계정의 프로필·공개 게시글만 열람 | 기존 회원 화면 |
| **공유된 게시글 단건** `/feeds/:feedId` | **해당 게시글만** 열람 + 로그인 모달 | 정상 |

- 페이지 가드(`proxy`)와 액션 가드(모달)를 분리.
- **토큰 재발급은 proxy에서 하지 않음** — BFF(`requireAccessToken` / `withAuth`)만 Spring `/auth/refresh` 호출.

---

## 2. 인증 제외 경로 (페이지)

- `/login`, `/signup` (+ 하위)
- `/feeds/:feedId` (단건만, 예: `/feeds/101`)
- `/myultary/:nickname` (루트만, 공개 계정만. 하위 경로는 로그인 필요)

실제 회원 페이지는 `refresh` 또는 `access` 쿠키가 없으면 `/login`으로 이동한다. 존재하지 않는 URL은 인증 여부와 무관하게 Next.js의 공통 404가 처리한다. 회원 페이지 경로 목록은 member-page-paths.ts에 유지하며 테스트에서 실제 app/(main) 페이지와 비교한다.

일반 로그인과 구글·카카오 로그인 성공 시 항상 메인 `/`으로 이동한다. 기존 `returnUrl` 쿼리나 OAuth 복귀 쿠키가 있어도 로그인 목적지로 사용하지 않는다. SNS **계정 연동**은 로그인과 별개이며 기존 설정 화면으로 복귀한다.

`/admin` 이하는 회원 가드 밖이다. 회원 `access`/`refresh`로 통과시키지 않고, 회원 `/login`으로 보내지도 않는다. 관리자 쿠키 `adminAccessToken` 또는 `adminRefreshToken`이 있으면 페이지를 보여주고, 없으면 같은 URL에 로그인 폼을 그린다. 로그인·재발급·로그아웃은 BFF `/api/admin/auth/*`가 Spring `/api/v1/admin/auth/*`를 호출하고 관리자 쿠키만 다룬다. 로그아웃하면 같은 `/admin`이 로그인 폼으로 돌아온다. 응답은 `Cache-Control: private, no-store`.

---

## 3. 공유 게시글 예외

1. 게스트에게 단건 UI 표시 (정적).
2. 로그인 모달 표시 — **닫기 가능**.
3. 이후 클릭/스와이프 등 인터랙션 → 모달 **재표시** (동작 차단).
4. 로그인 성공 시 메인 `/`으로 이동.

---

## 4. 레이어

| 레이어 | 역할 |
|--------|------|
| `src/proxy.ts` | 쿠키 유무만 검사, 실제 회원 경로는 로그인 redirect (refresh 호출 없음) |
| `requireAccessToken` / `withAuth` | access 없으면 Spring refresh → 쿠키 설정 |
| `withOptionalAuth` | `GET /api/feeds/:id` 및 공개 참조 파일 content 게스트 허용 |
| Spring | [`spring-auth-api.md`](./spring-auth-api.md) |

---

## 5. 체크리스트

- [x] 인증 제외 라우트 화이트리스트 (`lib/auth/paths.ts`)
- [x] middleware/`proxy` → 회원 경로는 로그인 redirect, 없는 URL은 404
- [x] 공유 단건 페이지 `/feeds/[feedId]` + 로그인 모달
- [x] BFF `GET` 단건 optional auth
- [x] Spring PUBLIC 단건 익명 GET ([`spring-auth-api.md`](./spring-auth-api.md))
- [x] api-memo · spring-auth-api에 게스트 GET 명시
- [x] 로그인 form/소셜 로그인 성공 시 메인 `/` 이동

## 페이지 조회 오류 구분 (2026-10-22)

페이지 조회의 401은 로그인으로 이동한다. 없는 리소스·접근 불가(403·404·410)는 공통 not-found 화면을 표시한다. 서버 오류·네트워크 장애·시간 초과·요청 제한은 새로고침 버튼이 있는 일시 오류 화면을 유지한다. 공개 피드·울타리 서버 조회 및 회원 페이지 초기 조회에 적용하며, 작성·수정 등의 실행 실패 모달은 유지한다. 관리자 로그인은 기존 별도 인증 흐름을 유지한다.
