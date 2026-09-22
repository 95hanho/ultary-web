# 페이지·API 인증 접근 규칙

> 상태: **FE/BFF 1차 적용** · Spring은 [`spring-auth-api.md`](./spring-auth-api.md)  
> 대상: FE(페이지·모달) · BFF · Spring (공개 단건 피드 등)

---

## 1. 기본 원칙

| 구분 | 비로그인 | 로그인 |
|------|----------|--------|
| 인증 제외 페이지 (로그인·회원가입 등) | 접근 가능 | 접근 가능 |
| **그 외 모든 페이지** | **로그인 페이지로 이동** (`returnUrl`) | 정상 |
| **공유된 게시글 단건** `/feeds/:feedId` | **해당 게시글만** 열람 + 로그인 모달 | 정상 |

- 페이지 가드(middleware)와 액션 가드(모달)를 분리.
- **토큰 재발급은 middleware에서 하지 않음** — BFF(`requireAccessToken` / `withAuth`)만 Spring `/auth/refresh` 호출.

---

## 2. 인증 제외 경로 (페이지)

- `/login`, `/signup` (+ 하위)
- `/feeds/:feedId` (단건만, 예: `/feeds/101`)

그 외 → `refresh` 또는 `access` 쿠키 없으면 `/login?returnUrl=...`

---

## 3. 공유 게시글 예외

1. 게스트에게 단건 UI 표시 (정적).
2. 로그인 모달 표시 — **닫기 가능**.
3. 이후 클릭/스와이프 등 인터랙션 → 모달 **재표시** (동작 차단).
4. 로그인 성공 시 `returnUrl`로 복귀.

---

## 4. 레이어

| 레이어 | 역할 |
|--------|------|
| `src/middleware.ts` | 쿠키 유무만 검사, 리다이렉트 (refresh 호출 없음) |
| `requireAccessToken` / `withAuth` | access 없으면 Spring refresh → 쿠키 설정 |
| `withOptionalAuth` | `GET /api/feeds/:id` 게스트 허용 |
| Spring | [`spring-auth-api.md`](./spring-auth-api.md) |

---

## 5. 체크리스트

- [x] 인증 제외 라우트 화이트리스트 (`lib/auth/paths.ts`)
- [x] middleware + `returnUrl`
- [x] 공유 단건 페이지 `/feeds/[feedId]` + 로그인 모달
- [x] BFF `GET` 단건 optional auth
- [ ] Spring PUBLIC 단건 익명 GET ([`spring-auth-api.md`](./spring-auth-api.md))
- [x] api-memo · spring-auth-api에 게스트 GET 명시
- [ ] 로그인 form/소셜 `returnUrl` 복귀 완성 (소셜 콜백 · form action)
