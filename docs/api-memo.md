# Ultary API 메모

> 인스타 벤치마킹 · 반려동물 전용 SNS  
> 팔로우 = **주민**, 팔로워 = **이웃**  
> 계정마다 반려동물 등록 및 태그명 생성 (태그명, 이름, 종, 부가설명 등)

BFF: `/api/...` · Spring: `/api/v1/...`  
알림의 «좋아요/태그/주민요청» 등은 **API가 아니라 알림 타입**이다.

---

## 1. 인증 · 유저

> 일반 유저 `loginId` 없음. 소셜 우선.  
> BFF가 Google/Kakao OAuth 처리 후 Spring `POST /api/v1/auth/social/login` 호출.  
> JWT는 Spring 발급, BFF는 httpOnly 쿠키(`accessToken`, `refreshToken`)로 보관.

| 기능 | Method | BFF | Spring |
|------|--------|-----|--------|
| 로그인 (email\|phone + password) | POST | `/api/auth/login` | `/api/v1/auth/login` |
| 로그인 토큰 재발급 | POST | `/api/auth/refresh` | `/api/v1/auth/refresh` |
| 로그아웃 | POST | `/api/auth/logout` | `/api/v1/auth/logout` |
| 내 회원정보 조회 | GET | `/api/auth/me` | `/api/v1/auth/me` |
| 회원정보 변경 (닉네임 등) | PATCH | `/api/auth/me` | `/api/v1/auth/me` |
| 회원탈퇴 | DELETE | `/api/auth/me` | `/api/v1/auth/me` |
| 회원가입 | POST | `/api/auth/signup` | `/api/v1/auth/signup` |
| 휴대폰 인증 | POST | `/api/auth/phone` | `/api/v1/auth/phone` |
| 휴대폰 인증 확인 | POST | `/api/auth/phone/verify` | `/api/v1/auth/phone/verify` |
| 비밀번호 변경 토큰 생성 | POST | `/api/auth/password/token` | `/api/v1/auth/password/token` |
| 비밀번호 변경 | PUT | `/api/auth/password` | `/api/v1/auth/password` |
| 구글 소셜 로그인 시작 (BFF OAuth) | GET | `/api/auth/social/google` | — |
| 구글 소셜 콜백 (BFF→Spring) | GET | `/api/auth/social/google/callback` | `POST /api/v1/auth/social/login` |
| 카카오 소셜 로그인 시작 (BFF OAuth) | GET | `/api/auth/social/kakao` | — |
| 카카오 소셜 콜백 (BFF→Spring) | GET | `/api/auth/social/kakao/callback` | `POST /api/v1/auth/social/login` |
| 소셜 계정 연동 | POST | `/api/auth/social/link` | `/api/v1/auth/social/link` |
| 소셜 계정 연동 해제 | DELETE | `/api/auth/social/unlink` | `/api/v1/auth/social/unlink` |

### 소셜 로그인 body (Spring)

```json
{
  "provider": "GOOGLE" | "KAKAO",
  "providerUserId": "<소셜 고유 ID>",
  "email": "<optional>",
  "name": "<optional>"
}
```

응답 `data`: accessToken, refreshToken, tokenType, expiresIn, **newUser**, **defaultNickname**  
`defaultNickname === true` → UI에서 「닉네임을 변경해주세요.」(마이울타리 안내 / 마이페이지에서 변경)

### Redirect URI (로컬)

- `http://localhost:3000/api/auth/social/google/callback`
- `http://localhost:3000/api/auth/social/kakao/callback`

---

## 2. 메인

| 기능 | Method | BFF |
|------|--------|-----|
| 주민 스토리 있는 목록 조회 | GET | `/api/main/stories/owners` |
| 주민 스토리 조회 | GET | `/api/main/stories` |
| 주민 게시글 조회 (무한 스크롤) | GET | `/api/main/feeds` |
| 검색 (유저 / 반려동물 / 태그 / 게시글) | GET | `/api/main/search` |

---

## 3. 마이울타리

| 기능 | Method | BFF |
|------|--------|-----|
| 마이울타리 정보 조회 (프로필·스토리유무·주민수·이웃수·상태글) | GET | `/api/my-ultary` |
| MY 게시글 조회 (그리드) | GET | `/api/my-ultary/feeds` |
| MY 게시글 상세 (피드형) | GET | `/api/my-ultary/feeds/:feedId` |
| 저장한 게시글 조회 | GET | `/api/my-ultary/saved-feeds` |
| 자신이 태그된 게시글 조회 | GET | `/api/my-ultary/tagged-feeds` |
| 프로필 사진 변경 | PATCH | `/api/my-ultary/profile-image` |
| 소개글 변경 | PATCH | `/api/my-ultary/bio` |
| 스토리 등록 | POST | `/api/my-ultary/stories` |
| 스토리 삭제 | DELETE | `/api/my-ultary/stories/:storyId` |

---

## 4. 반려동물

| 기능 | Method | BFF |
|------|--------|-----|
| 반려동물 목록 | GET | `/api/pets` |
| 반려동물 등록 | POST | `/api/pets` |
| 반려동물 수정 | PATCH | `/api/pets/:petId` |
| 반려동물 삭제 | DELETE | `/api/pets/:petId` |
| 피드 반려동물 태그 승인 | POST | `/api/pets/tags/:feedPetId/approve` |
| 피드 반려동물 태그 거절 | POST | `/api/pets/tags/:feedPetId/reject` |

---

## 5. 게시글

| 기능 | Method | BFF |
|------|--------|-----|
| 게시글 등록 | POST | `/api/feeds` |
| 게시글 상세 | GET | `/api/feeds/:feedId` |
| 게시글 수정 | PATCH | `/api/feeds/:feedId` |
| 게시글 삭제 | DELETE | `/api/feeds/:feedId` |
| 좋아요 | POST | `/api/feeds/:feedId/like` |
| 좋아요 취소 | DELETE | `/api/feeds/:feedId/like` |
| 좋아요한 사람 목록 | GET | `/api/feeds/:feedId/likers` |
| 게시글 저장 | POST | `/api/feeds/:feedId/store` |
| 게시글 저장 해제 | DELETE | `/api/feeds/:feedId/store` |
| 게시글 공유 (URL 복사·DM 전송) | POST | `/api/feeds/:feedId/share` |
| 댓글 목록 | GET | `/api/feeds/:feedId/comments` |
| 댓글 작성 | POST | `/api/feeds/:feedId/comments` |
| 댓글 수정 | PATCH | `/api/feeds/:feedId/comments/:commentId` |
| 댓글 삭제 | DELETE | `/api/feeds/:feedId/comments/:commentId` |
| 답글 목록 | GET | `/api/feeds/:feedId/comments/:commentId/replies` |
| 답글 작성 | POST | `/api/feeds/:feedId/comments/:commentId/replies` |
| 답글 수정 | PATCH | `/api/feeds/:feedId/comments/:commentId/replies/:replyId` |
| 답글 삭제 | DELETE | `/api/feeds/:feedId/comments/:commentId/replies/:replyId` |

---

## 6. 태그

| 기능 | Method | BFF |
|------|--------|-----|
| 태그 등록 | POST | `/api/tags` |
| 태그 정보 조회 (호버·클릭) | GET | `/api/tags/:tagId` |
| 태그 검색 | GET | `/api/tags/search` |
| 내용 입력 시 태그 추천 | GET | `/api/tags/recommend` |

> 해시태그 / 반려동물 태그명 / 관리자 검수 대상 태그는 구현 시 구분한다.

---

## 7. 다른 유저 울타리 · 관계

| 기능 | Method | BFF |
|------|--------|-----|
| 해당 유저 울타리 정보 (프로필·스토리·주민/이웃수·상태글·이웃여부) | GET | `/api/users/:userNo/ultary` |
| 주민·이웃 목록 | GET | `/api/users/:userNo/neighbors` |
| 주민(이웃) 요청 | POST | `/api/users/:userNo/neighbors/request` |
| 주민 요청 수락 | POST | `/api/neighbors/:neighborId/accept` |
| 주민 요청 거절 | POST | `/api/neighbors/:neighborId/reject` |
| 주민 요청 취소 · 이웃 해제 | DELETE | `/api/neighbors/:neighborId` |
| 유저 차단 | POST | `/api/users/:userNo/block` |
| 유저 차단 해제 | DELETE | `/api/users/:userNo/block` |
| 신고 | POST | `/api/reports` |

---

## 8. 게시글 작성 중

| 기능 | Method | BFF |
|------|--------|-----|
| 작성할 사진 목록 임시저장 | POST | `/api/write/draft-photos` |
| 사진 편집본 저장 | POST | `/api/write/edited-photos` |
| 사진 태그 저장 | POST | `/api/write/photo-tags` |

태그 검색·추천은 [6. 태그](#6-태그) 참고.

---

## 9. DM

| 기능 | Method | BFF |
|------|--------|-----|
| 메시지(대화방) 리스트 | GET | `/api/dm/rooms` |
| 대화방 생성 | POST | `/api/dm/rooms` |
| 대화방 나가기 | DELETE | `/api/dm/rooms/:roomId` |
| 읽음 처리 | POST | `/api/dm/rooms/:roomId/read` |
| 대화방 메시지 조회 | GET | `/api/dm/rooms/:roomId/messages` |
| 메시지 전송 | POST | `/api/dm/rooms/:roomId/messages` |

---

## 10. 알림

| 기능 | Method | BFF |
|------|--------|-----|
| 알림 목록 조회 | GET | `/api/notifications` |
| 알림 단건 읽음 | PATCH | `/api/notifications/:notificationId/read` |
| 알림 전체 읽음 | POST | `/api/notifications/read-all` |

### 알림 타입 (참고)

- 게시글 좋아요
- 게시글 태그됨
- 스토리 좋아요
- 울타리 주민 요청
- (스키마) 댓글·답글·멘션·주민 수락·펫 태그 요청/승인·시스템 등

---

## 11. 설정

| 기능 | Method | BFF |
|------|--------|-----|
| 설정 조회 (프로필 공개 범위 등) | GET | `/api/settings` |
| 설정 변경 | PATCH | `/api/settings` |

---

## 12. 관리자

| 기능 | Method | BFF |
|------|--------|-----|
| 태그 승인 | POST | `/api/admin/tags/:tagId/approve` |
| 태그 거절 | POST | `/api/admin/tags/:tagId/reject` |

---

## 참고

- 코드 상수: `src/lib/api/endpoints.ts` (`bffEndpoints` / `springEndpoints`)
- BFF 스켈레톤: `src/app/api/**/route.ts`
- REST Client 틀: `http/bff.http`
- DB 스키마: `database/schema/mariadb_10_1/001_init_schema.sql`
