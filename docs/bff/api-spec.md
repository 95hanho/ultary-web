# BFF API 명세

- **Base URL (로컬):** `http://localhost:3000`
- **Spring upstream:** `{SPRING_BASE_URL}/api/v1/**` (기본 `http://localhost:9377`)
- **상태:** ✅ 구현 · 🚧 스켈레톤 (501)

공통 query (페이지네이션): `cursor`, `size` — 도메인별 기본값은 `http/bff.http` 참고.

---

## 1. 헬스

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| GET | `/api/health` | `/api/v1/health` | — | 🚧 |

---

## 2. 인증 · 유저

> JWT는 Spring 발급, BFF는 httpOnly 쿠키 보관.  
> 일반 유저 `loginId` 없음 — 소셜 우선.

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| POST | `/api/auth/login` | `/api/v1/auth/login` | — | ✅ |
| POST | `/api/auth/refresh` | `/api/v1/auth/refresh` | refresh 쿠키 | ✅ |
| POST | `/api/auth/logout` | `/api/v1/auth/logout` | access 쿠키 | ✅ |
| GET | `/api/auth/me` | `/api/v1/auth/me` | ✅ | ✅ |
| PATCH | `/api/auth/me` | `/api/v1/auth/me` | ✅ | ✅ |
| DELETE | `/api/auth/me` | `/api/v1/auth/me` | ✅ | ✅ |
| POST | `/api/auth/signup` | `/api/v1/auth/signup` | — | ✅ |
| POST | `/api/auth/phone` | `/api/v1/auth/phone` | — | ✅ |
| POST | `/api/auth/phone/verify` | `/api/v1/auth/phone/verify` | — | ✅ |
| POST | `/api/auth/password/token` | `/api/v1/auth/password/token` | — | 🚧 |
| PUT | `/api/auth/password` | `/api/v1/auth/password` | — | 🚧 |
| GET | `/api/auth/social/google` | — (BFF OAuth) | — | ✅ |
| GET | `/api/auth/social/google/callback` | `POST /api/v1/auth/social/login` | — | ✅ |
| GET | `/api/auth/social/kakao` | — (BFF OAuth) | — | ✅ |
| GET | `/api/auth/social/kakao/callback` | `POST /api/v1/auth/social/login` | — | ✅ |
| POST | `/api/auth/social/link` | `/api/v1/auth/social/link` | ✅ | 🚧 |
| DELETE | `/api/auth/social/unlink?provider=` | `/api/v1/auth/social/unlink` | ✅ | 🚧 |

### POST `/api/auth/login`

**Body**

```json
{ "email": "...", "password": "..." }
```

또는 `{ "phone": "010...", "password": "..." }`

**성공:** `{ "success": true, "message": "LOGIN_SUCCESS" }` + Set-Cookie

### GET `/api/auth/me` 성공 data

`MeResponse` — `src/types/api.ts` 참고 (`userNo`, `nickname`, `defaultNickname`, …)

### POST Spring social/login (BFF 내부)

```json
{
  "provider": "GOOGLE" | "KAKAO",
  "providerUserId": "...",
  "email": "...",
  "name": "..."
}
```

응답: `newUser`, `defaultNickname` 포함 → UI 닉네임 변경 안내

---

## 3. 메인

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| GET | `/api/main/stories/owners` | `/api/v1/main/stories/owners` | ✅ | 🚧 |
| GET | `/api/main/stories?userNo=` | `/api/v1/main/stories` | ✅ | 🚧 |
| GET | `/api/main/feeds?cursor=&size=` | `/api/v1/main/feeds` | ✅ | 🚧 |
| GET | `/api/main/search?q=&type=` | `/api/v1/main/search` | ✅ | 🚧 |

---

## 4. 마이울타리

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| GET | `/api/my-ultary` | `/api/v1/my-ultary` | ✅ | 🚧 |
| GET | `/api/my-ultary/feeds` | `/api/v1/my-ultary/feeds` | ✅ | 🚧 |
| GET | `/api/my-ultary/feeds/:feedId` | `/api/v1/my-ultary/feeds/:feedId` | ✅ | 🚧 |
| GET | `/api/my-ultary/saved-feeds` | `/api/v1/my-ultary/saved-feeds` | ✅ | 🚧 |
| GET | `/api/my-ultary/tagged-feeds` | `/api/v1/my-ultary/tagged-feeds` | ✅ | 🚧 |
| PATCH | `/api/my-ultary/profile-image` | `/api/v1/my-ultary/profile-image` | ✅ | 🚧 |
| PATCH | `/api/my-ultary/bio` | `/api/v1/my-ultary/bio` | ✅ | 🚧 |
| POST | `/api/my-ultary/stories` | `/api/v1/my-ultary/stories` | ✅ | 🚧 |
| DELETE | `/api/my-ultary/stories/:storyId` | `/api/v1/my-ultary/stories/:storyId` | ✅ | 🚧 |

---

## 5. 반려동물

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| GET | `/api/pets` | `/api/v1/pets` | ✅ | 🚧 |
| POST | `/api/pets` | `/api/v1/pets` | ✅ | 🚧 |
| PATCH | `/api/pets/:petId` | `/api/v1/pets/:petId` | ✅ | 🚧 |
| DELETE | `/api/pets/:petId` | `/api/v1/pets/:petId` | ✅ | 🚧 |
| POST | `/api/pets/tags/:feedPetId/approve` | `/api/v1/pets/tags/:feedPetId/approve` | ✅ | 🚧 |
| POST | `/api/pets/tags/:feedPetId/reject` | `/api/v1/pets/tags/:feedPetId/reject` | ✅ | 🚧 |

---

## 6. 게시글

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| POST | `/api/feeds` | `/api/v1/feeds` | ✅ | 🚧 |
| GET | `/api/feeds/:feedId` | `/api/v1/feeds/:feedId` | ✅ | 🚧 |
| PATCH | `/api/feeds/:feedId` | `/api/v1/feeds/:feedId` | ✅ | 🚧 |
| DELETE | `/api/feeds/:feedId` | `/api/v1/feeds/:feedId` | ✅ | 🚧 |
| POST | `/api/feeds/:feedId/like` | `/api/v1/feeds/:feedId/like` | ✅ | 🚧 |
| DELETE | `/api/feeds/:feedId/like` | `/api/v1/feeds/:feedId/like` | ✅ | 🚧 |
| GET | `/api/feeds/:feedId/likers` | `/api/v1/feeds/:feedId/likers` | ✅ | 🚧 |
| POST | `/api/feeds/:feedId/store` | `/api/v1/feeds/:feedId/store` | ✅ | 🚧 |
| DELETE | `/api/feeds/:feedId/store` | `/api/v1/feeds/:feedId/store` | ✅ | 🚧 |
| POST | `/api/feeds/:feedId/share` | `/api/v1/feeds/:feedId/share` | ✅ | 🚧 |
| GET | `/api/feeds/:feedId/comments` | `/api/v1/feeds/:feedId/comments` | ✅ | 🚧 |
| POST | `/api/feeds/:feedId/comments` | `/api/v1/feeds/:feedId/comments` | ✅ | 🚧 |
| PATCH | `/api/feeds/:feedId/comments/:commentId` | `/api/v1/feeds/:feedId/comments/:commentId` | ✅ | 🚧 |
| DELETE | `/api/feeds/:feedId/comments/:commentId` | `/api/v1/feeds/:feedId/comments/:commentId` | ✅ | 🚧 |
| GET | `.../comments/:commentId/replies` | 동일 Spring 경로 | ✅ | 🚧 |
| POST | `.../comments/:commentId/replies` | 동일 | ✅ | 🚧 |
| PATCH | `.../replies/:replyId` | 동일 | ✅ | 🚧 |
| DELETE | `.../replies/:replyId` | 동일 | ✅ | 🚧 |

---

## 7. 태그

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| POST | `/api/tags` | `/api/v1/tags` | ✅ | 🚧 |
| GET | `/api/tags/:tagId` | `/api/v1/tags/:tagId` | ✅ | 🚧 |
| GET | `/api/tags/search?q=` | `/api/v1/tags/search` | ✅ | 🚧 |
| GET | `/api/tags/recommend?q=` | `/api/v1/tags/recommend` | ✅ | 🚧 |

---

## 8. 다른 유저 · 이웃 · 신고

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| GET | `/api/users/:userNo/ultary` | `/api/v1/users/:userNo/ultary` | ✅ | 🚧 |
| GET | `/api/users/:userNo/neighbors?type=` | `/api/v1/users/:userNo/neighbors` | ✅ | 🚧 |
| POST | `/api/users/:userNo/neighbors/request` | `/api/v1/users/:userNo/neighbors/request` | ✅ | 🚧 |
| POST | `/api/neighbors/:neighborId/accept` | `/api/v1/neighbors/:neighborId/accept` | ✅ | 🚧 |
| POST | `/api/neighbors/:neighborId/reject` | `/api/v1/neighbors/:neighborId/reject` | ✅ | 🚧 |
| DELETE | `/api/neighbors/:neighborId` | `/api/v1/neighbors/:neighborId` | ✅ | 🚧 |
| POST | `/api/users/:userNo/block` | `/api/v1/users/:userNo/block` | ✅ | 🚧 |
| DELETE | `/api/users/:userNo/block` | `/api/v1/users/:userNo/block` | ✅ | 🚧 |
| POST | `/api/reports` | `/api/v1/reports` | ✅ | 🚧 |

> 팔로우 = **주민**, 팔로워 = **이웃**

---

## 9. 게시글 작성 중

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| POST | `/api/write/draft-photos` | `/api/v1/write/draft-photos` | ✅ | 🚧 |
| POST | `/api/write/edited-photos` | `/api/v1/write/edited-photos` | ✅ | 🚧 |
| POST | `/api/write/photo-tags` | `/api/v1/write/photo-tags` | ✅ | 🚧 |

---

## 10. DM

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| GET | `/api/dm/rooms` | `/api/v1/dm/rooms` | ✅ | 🚧 |
| POST | `/api/dm/rooms` | `/api/v1/dm/rooms` | ✅ | 🚧 |
| DELETE | `/api/dm/rooms/:roomId` | `/api/v1/dm/rooms/:roomId` | ✅ | 🚧 |
| POST | `/api/dm/rooms/:roomId/read` | `/api/v1/dm/rooms/:roomId/read` | ✅ | 🚧 |
| GET | `/api/dm/rooms/:roomId/messages` | `/api/v1/dm/rooms/:roomId/messages` | ✅ | 🚧 |
| POST | `/api/dm/rooms/:roomId/messages` | `/api/v1/dm/rooms/:roomId/messages` | ✅ | 🚧 |

---

## 11. 알림

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| GET | `/api/notifications` | `/api/v1/notifications` | ✅ | 🚧 |
| PATCH | `/api/notifications/:notificationId/read` | `/api/v1/notifications/:notificationId/read` | ✅ | 🚧 |
| POST | `/api/notifications/read-all` | `/api/v1/notifications/read-all` | ✅ | 🚧 |

알림 **타입**(좋아요, 태그, 주민요청 등)은 API가 아니라 `notification.type` 값이다.

---

## 12. 설정

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| GET | `/api/settings` | `/api/v1/settings` | ✅ | 🚧 |
| PATCH | `/api/settings` | `/api/v1/settings` | ✅ | 🚧 |

---

## 13. 관리자

| Method | BFF | Spring | Auth | 상태 |
|--------|-----|--------|------|------|
| POST | `/api/admin/tags/:tagId/approve` | `/api/v1/admin/tags/:tagId/approve` | ✅ (admin) | 🚧 |
| POST | `/api/admin/tags/:tagId/reject` | `/api/v1/admin/tags/:tagId/reject` | ✅ (admin) | 🚧 |

---

## 관련 파일

| 용도 | 경로 |
|------|------|
| 엔드포인트 상수 | `src/lib/api/endpoints.ts` |
| 요청 예시 | `http/bff.http` |
| 타입 | `src/types/**` |
| 도메인 메모 | `docs/api-memo.md` |
