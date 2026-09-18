# Ultary API 메모

> FE BFF 아키텍처·구현 가이드: [`docs/bff/`](../../docs/bff/README.md)  
> 입력 검사: [`share/validation/`](../validation/README.md) · 계약: [`API_CONTRACT.md`](./API_CONTRACT.md)

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
| 회원정보 변경 (닉네임 제외) | PATCH | `/api/auth/me` | `/api/v1/auth/me` |
| 닉네임 변경 가능 여부 | GET | `/api/auth/me/nickname/change-availability` | `/api/v1/auth/me/nickname/change-availability` |
| 닉네임 변경 (생성·변경 후 7일 쿨다운) | PATCH | `/api/auth/me/nickname` | `/api/v1/auth/me/nickname` |
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

닉네임: 영문·한글만. 한글만 2~5자, 영문만 4~10자. 혼합 시 한글 1자=2·영문 1자=1, 가중치 합 4~10(한글 최대 5자).

로그인 `phone`: DB·조회는 digits only(`^01[0-9]{8,9}$`). 요청에 하이픈/공백/`+82`가 있어도 서버에서 정규화. HTTP 예시는 항상 `"01011112222"`(JSON 문자열).

입력 검사 공통 스펙: `share/validation/rules.json` (닉네임·비번·폰·handle·hashtag). Bean Validation 실패 시 `ApiResponse` `success:false` + `message` + `data`(필드 맵).

### Redirect URI (로컬)

- `http://localhost:3000/api/auth/social/google/callback`
- `http://localhost:3000/api/auth/social/kakao/callback`

---

## 2. 메인

| 기능 | Method | BFF | Spring | 상태 |
|------|--------|-----|--------|------|
| 주민 스토리 있는 목록 조회 | GET | `/api/main/stories/owners` | `/api/v1/main/stories/owners` | 구현 |
| 주민 스토리 조회 | GET | `/api/main/stories?userNo=` | `/api/v1/main/stories?userNo=` | 구현 |
| 주민 게시글 조회 (무한 스크롤) | GET | `/api/main/feeds` | `/api/v1/main/feeds` | 구현 |
| 검색 (유저 / 반려동물 / 태그 / 게시글) | GET | `/api/main/search` | `/api/v1/main/search` | 구현 |

> 스토리 소유자 목록 = 내가 팔로우(`requester` ACCEPTED)한 유저 중 활성 스토리 보유자. `hasUnviewed`로 안 읽은 링 표시.  
> 메인 피드: 본인 + 주민 게시글. `PUBLIC` / 본인 / `NEIGHBORS`(ACCEPTED). 차단 쌍 제외. 커서 `cursorFeedId` + `nextCursorFeedId`.  
> 검색 `type`: `ALL`(기본) \| `USER` \| `PET` \| `TAG` \| `FEED`. `@`/`#` 접두는 서버에서 제거. URL 쿼리에서는 `#`를 `%23`, `@`를 `%40`로 인코딩해야 함(`#`는 fragment라 미인코딩 시 `q`/`type`이 잘림). 차단 유저·펫 제외.  
> HTTP: `requests/story.http`, `requests/main.http`

---

## 3. 마이울타리

| 기능 | Method | BFF | Spring | 상태 |
|------|--------|-----|--------|------|
| 마이울타리 정보 조회 (프로필·스토리유무·주민수·이웃수·상태글) | GET | `/api/my-ultary` | `/api/v1/my-ultary` | 구현 |
| MY 게시글 조회 (그리드) | GET | `/api/my-ultary/feeds` | `/api/v1/my-ultary/feeds` | 구현 |
| MY 게시글 상세 (피드형) | GET | `/api/my-ultary/feeds/:feedId` | `/api/v1/my-ultary/feeds/:feedId` | 구현 |
| 저장한 게시글 조회 | GET | `/api/my-ultary/saved-feeds` | `/api/v1/my-ultary/saved-feeds` | 구현 |
| 자신이 태그된 게시글 조회 | GET | `/api/my-ultary/tagged-feeds` | `/api/v1/my-ultary/tagged-feeds` | 구현 |
| 프로필 사진 변경 | PATCH | `/api/my-ultary/profile-image` | `/api/v1/my-ultary/profile-image` | 구현 |
| 소개글 변경 | PATCH | `/api/my-ultary/bio` | `/api/v1/my-ultary/bio` | 구현 |
| 내 스토리 목록 | GET | `/api/my-ultary/stories` | `/api/v1/my-ultary/stories` | 구현 |
| 스토리 등록 | POST | `/api/my-ultary/stories` | `/api/v1/my-ultary/stories` | 구현 |
| 스토리 삭제 | DELETE | `/api/my-ultary/stories/:storyId` | `/api/v1/my-ultary/stories/:storyId` | 구현 |
| 스토리 읽음 | POST | `/api/stories/:storyId/view` | `/api/v1/stories/:storyId/view` | 구현 |

> 주민 = 팔로잉(`requester` ACCEPTED), 이웃 = 팔로워(`receiver` ACCEPTED).  
> 스토리: IMAGE\|VIDEO, `expires_at = created_at + 24h`, 읽음은 `ultary_story_view`. 조회는 본인 또는 ACCEPTED 이웃.  
> tagged-feeds: 내 펫 `COLLABORATOR` 또는 사진 `@` 멘션된 게시글.  
> HTTP: `requests/my-ultary.http` (시드 user 101 / `google-myultary-test-001`)

---

## 4. 반려동물

| 기능 | Method | BFF |
|------|--------|-----|
| 반려동물 목록 | GET | `/api/pets` |
| 반려동물 등록 | POST | `/api/pets` |
| 반려동물 수정 (name·mentionId 제외) | PATCH | `/api/pets/:petId` |
| mention_id 변경 가능 여부 | GET | `/api/pets/:petId/mention-id/change-availability` |
| mention_id 변경 (생성·변경 후 30일 쿨다운) | PATCH | `/api/pets/:petId/mention-id` |
| 반려동물 삭제 | DELETE | `/api/pets/:petId` |

> `name`은 생성 후 불변. 사진 `@` 멘션·공동작성은 승인/거절 없음. 멘션된 피드는 `GET /api/my-ultary/tagged-feeds`, 삭제는 작성자 또는 COLLABORATOR 펫 보호자.

---

## 5. 게시글

| 기능 | Method | BFF |
|------|--------|-----|
| 게시글 등록 | POST | `/api/feeds` |
| 게시글 상세 | GET | `/api/feeds/:feedId` |
| 게시글 수정 | PATCH | `/api/feeds/:feedId` |
| 게시글 삭제 | DELETE | `/api/feeds/:feedId` |

> 삭제 권한: 작성자 또는 `feed_pet.role=COLLABORATOR` 펫의 보호자. `deleted_by_user_no`에 실제 삭제자 기록.
> 등록 시 `media` 1개 이상 필수. PATCH는 content·visibility만 (미디어/펫/태그 교체 미지원).
> `PRIVATE`는 작성자만 조회. `NEIGHBORS`는 ACCEPTED 이웃만 조회.
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
| 태그 수정 (hashtag·handle 제외) | PATCH | `/api/tags/:tagId` |
| handle 변경 가능 여부 | GET | `/api/tags/:tagId/handle/change-availability` |
| handle 변경/최초 설정 (설정·변경 후 30일 쿨다운) | PATCH | `/api/tags/:tagId/handle` |
| 태그 검색 | GET | `/api/tags/search` |
| 내용 입력 시 태그 추천 | GET | `/api/tags/recommend` |

> `hashtag`는 생성 후 불변. `handle`은 선택·UNIQUE. handle 미설정(`handle_changed_at` NULL)이면 최초 설정은 언제든 가능. 생성 시 handle을 넣으면 그 시점부터 30일 쿨다운.

> 해시태그 / 반려동물 태그명 / 관리자 검수 대상 태그는 구현 시 구분한다.

---

## 7. 다른 유저 울타리 · 관계

| 기능 | Method | BFF | Spring | 상태 |
|------|--------|-----|--------|------|
| 해당 유저 울타리 정보 | GET | `/api/users/:userNo/ultary` | `/api/v1/users/:userNo/ultary` | 구현 |
| 주민·이웃 목록 | GET | `/api/users/:userNo/neighbors` | `/api/v1/users/:userNo/neighbors?type=` | 구현 |
| 주민(이웃) 요청 | POST | `/api/users/:userNo/neighbors/request` | `/api/v1/users/:userNo/neighbors/request` | 구현 |
| 주민 요청 수락 | POST | `/api/neighbors/:neighborId/accept` | `/api/v1/neighbors/:neighborId/accept` | 구현 |
| 주민 요청 거절 | POST | `/api/neighbors/:neighborId/reject` | `/api/v1/neighbors/:neighborId/reject` | 구현 |
| 주민 요청 취소 · 이웃 해제 | DELETE | `/api/neighbors/:neighborId` | `/api/v1/neighbors/:neighborId` | 구현 |
| 유저 차단 | POST | `/api/users/:userNo/block` | `/api/v1/users/:userNo/block` | 구현 |
| 유저 차단 해제 | DELETE | `/api/users/:userNo/block` | `/api/v1/users/:userNo/block` | 구현 |
| 신고 | POST | `/api/reports` | — | 미구현 |

> `type=RESIDENTS`(주민/팔로잉, 기본) · `type=NEIGHBORS`(이웃/팔로워).  
> `pair_key` = `minUserNo:maxUserNo` (한 쌍에 관계 행 1개).  
> `relationStatus`: `NONE` \| `PENDING_SENT` \| `PENDING_RECEIVED` \| `ACCEPTED` \| `REJECTED` \| `BLOCKED`.  
> 차단 시 기존 neighbor 행 삭제. 상대가 나를 차단하면 울타리/목록 조회 `USER_BLOCKED`.  
> 피드 `visibility=NEIGHBORS`는 ACCEPTED 쌍만 조회 가능.  
> HTTP: `requests/neighbor.http` (시드 user 101~105)

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
- (스키마) 댓글·답글·멘션·주민 수락·공동작성(FEED_COLLABORATOR)·시스템 등

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
- REST Client 틀: `http/bff.http` (프론트) · Spring: `requests/*.http`
- DB 스키마: `share/database/schema/mariadb_10_1/001_init_schema.sql` (**schema_version 7**, 스토리 포함)
- 로컬 시드(선택): `share/database/seed/mariadb_10_1/001_dev_sample_data.sql`  
  - 스키마 직후 실행. **재실행 가능**(CLEANUP 후 INSERT). 운영/최종 배포에서는 실행하지 않음.  
  - `ultary_file`은 업로드 디렉터리에 있는 실제 파일만 (`images/…`, `videos/…`).  
  - 시드 user **101~105** (펫 유저당 1~2). HTTP: `my-ultary` / `story` / `neighbor` → 101 (`google-myultary-test-001`)
- 입력 검사 공통 스펙: `share/validation/` (`rules.json`)

### Spring 구현 진행 (BE)

| Phase | 내용 | 비고 |
|-------|------|------|
| 1-7 | Auth / File / Pet | 완료 |
| 1-8 | Tag | 완료 |
| 1-9 | Feed (+ 성공 메시지) | 완료 |
| 1-10 | MyUltary + Story (스키마 v7) | HTTP 스모크 테스트함. **최종 E2E는 별도 재검증 예정** |
| 1-11 | Neighbor (+ block, NEIGHBORS 피드 가시성) | 스모크 테스트함. 시드 user 5·pet 1~2. HTTP `neighbor.http` |
| 1-12 | Main feeds/search | 타임라인 커서 + 통합 검색. HTTP `main.http` |
| 다음 | DM·알림 등 | 미착수 |

파일 업로드 상대경로: `images/{uuid}.ext`, `videos/{uuid}.ext` (`UPLOAD_DIR` / `D:/files/ultary-api`).
