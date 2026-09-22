# Spring API — 인증·게스트 열람 변경사항

> FE/BFF는 이미 반영됨.  
> **ultary-api에서 할 일:** 이 파일(+ `auth-access.md`)을 share에서 가져와  
> **「share의 최신 변경사항들 적용해줘」** 로 맞춘다.

관련: [`auth-access.md`](./auth-access.md) · [`api-memo.md`](./api-memo.md) · [`API_CONTRACT.md`](./API_CONTRACT.md)

---

## 0. Spring에 복붙할 요약 (필수만)

1. **토큰 발급·검증·로테이션은 Spring만** (기존 유지). BFF는 JWT를 만들지 않고 `POST /api/v1/auth/refresh`만 호출한다.
2. **`GET /api/v1/feeds/{feedId}`** — `Authorization` 없이 호출 가능해야 함.
   - 조건: `visibility = PUBLIC` + 차단 관계 아님.
   - 비PUBLIC / 권한 없음 → 기존과 동일하게 **404 또는 403**.
   - 로그인 시: 기존 가시성(이웃·본인) 유지.
3. 응답에 **FileSummary 임베드** 유지 (`media[].file`, `authorProfileFile` 등) + **작성자 `nickname`** (루트 `nickname` 또는 `authorNickname` / `author.nickname` 중 하나).
4. **좋아요·댓글·저장·공유·수정·삭제 등 쓰기/액션** — 익명 **401** (기존 유지·확인).
5. 피드 타임라인·검색·프로필 전체 등 **단건 외 API는 게스트에 열지 말 것**.

선택(후속): `GET .../comments` 만 PUBLIC 단건에 한해 게스트 읽기 허용 여부.

---

## 1. 토큰 책임 (변경 없음 · 명확화)

| 항목 | 담당 |
|------|------|
| access / refresh **발급·검증·로테이션** | **Spring만** |
| httpOnly 쿠키 보관 | BFF (Next) |
| JWT 서명/파싱으로 refresh | BFF **하지 않음** (쿠키 유무 + Spring `/auth/refresh` 호출만) |

기존 `POST /api/v1/auth/login|refresh|logout|social/login` 유지.  
refresh 요청 body: `{ "refreshToken": "..." }` → `TokenResponse` (accessToken, refreshToken, expiresIn, …).

---

## 2. 필수 — 게시글 단건 게스트 조회

### `GET /api/v1/feeds/{feedId}`

| 항목 | 내용 |
|------|------|
| **비로그인** | `Authorization` 없이 호출 가능 |
| **허용 조건** | `visibility = PUBLIC`, 작성자↔조회자 차단 아님 |
| **비공개** | `NEIGHBORS` / `PRIVATE` 등 → 비로그인·무권한 시 **404 또는 403** |
| **로그인** | 기존과 동일 |
| **응답** | 기존 단건 + FileSummary + **작성자 nickname** (위 §0) |

게스트에게 댓글 목록을 열지 여부는 §3.  
최소: 단건에 `likeCount` / `commentCount` 숫자만 있어도 FE 정적 표시 가능.

### 쓰·액션 API

- 좋아요·댓글·저장·공유·PATCH·DELETE 등 **전부 인증 필수**.
- 비로그인 → **401**.

---

## 3. 선택 (후속)

| API | 제안 |
|-----|------|
| `GET /api/v1/feeds/{feedId}/comments` | PUBLIC 단건에 한해 게스트 읽기. **POST는 인증 필수** |
| `GET /api/v1/feeds/{feedId}/likers` | 인증 유지 권장 |
| OG/스크랩 메타 | 별도 공개 엔드포인트 또는 SSR — FE 후속 |

---

## 4. BFF 매핑 (참고)

| BFF | Spring | 게스트 |
|-----|--------|--------|
| `GET /api/feeds/:feedId` | `GET /api/v1/feeds/{feedId}` | ✅ PUBLIC |
| `POST/DELETE .../like` 등 | 동일 계열 | ❌ 401 |
| `POST /api/auth/refresh` | `POST /api/v1/auth/refresh` | refresh 쿠키 있을 때만 |

페이지 가드·로그인 모달은 FE. Spring은 **API 권한**만 맞추면 됨.

---

## 5. 구현 체크리스트 (Spring)

- [x] Security/필터: `GET /feeds/{id}` 익명 허용
- [x] 서비스: PUBLIC만 익명 반환 / 비PUBLIC·차단 → 기존 실패 응답
- [x] 응답: FileSummary + nickname (`authorNickname`)
- [x] like/comment/store/share/patch/delete — 익명 거부 (나머지 `/api/v1/**` authenticated)
- [ ] (선택) comments GET 게스트 정책 → `api-memo.md` 반영

---

## 6. 하지 말 것

- BFF와 **동시에** 여러 레이어에서 refresh 로테이션을 중복 강제하지 말 것 (FE는 BFF `requireAccessToken` / `withAuth`에서만 Spring refresh 호출).
- 게스트에게 타임라인·검색·타인 전체 프로필 API를 열지 말 것 (**단건 예외만**).
