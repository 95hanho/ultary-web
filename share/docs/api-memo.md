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

닉네임: 영문·숫자·한글. 한글만 2~5자, 영문·숫자만 4~10자. 혼합 시 한글 1자=2·영문·숫자 1자=1, 가중치 합 4~10(한글 최대 5자).

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
| 메인 추천 게시글 | GET | `/api/main/feeds/recommended` | `/api/v1/main/feeds/recommended` | 구현 |
| 검색 (유저 / 반려동물 / 태그 / 게시글) | GET | `/api/main/search` | `/api/v1/main/search` | 구현 |
| 검색 추천 게시글 | GET | `/api/main/search/recommended` | `/api/v1/main/search/recommended` | 구현 |
| 최근 검색 5건 | GET | `/api/main/search/recent` | `/api/v1/main/search/recent` | 구현 |
| 최근 검색 더보기 20건 | GET | `/api/main/search/recent/more?cursorHistoryId=` | `/api/v1/main/search/recent/more?cursorHistoryId=` | 구현 |
| 최근 검색 저장 | POST | `/api/main/search/recent` | `/api/v1/main/search/recent` | 구현 |
| 최근 검색 모두 지우기 | DELETE | `/api/main/search/recent` | `/api/v1/main/search/recent` | 구현 |
| 최근 펫 태그 20건 | GET | `/api/main/pet-tags/recent` | `/api/v1/main/pet-tags/recent` | 구현 |
| 최근 펫 태그 저장 | POST | `/api/main/pet-tags/recent` | `/api/v1/main/pet-tags/recent` | 구현 |
| 최근 펫 태그 모두 지우기 | DELETE | `/api/main/pet-tags/recent` | `/api/v1/main/pet-tags/recent` | 구현 |

> 스토리 소유자 목록 = 내가 팔로우(`requester` ACCEPTED)한 유저 중 활성 스토리 보유자. `hasUnviewed`는 `ultary_story_view` 기준(안 읽은 링). **미열람(`hasUnviewed=true`) 먼저**, 그다음 최신 스토리 순.  
> **프로필**: 항목마다 `profileFile` (`FileSummary | null`). 유저 전용 사진이 아니라, 그 유저의 활성 펫 중 사진이 있는 것 가운데 `priority`가 가장 높은 펫 사진. 없으면 `null`. 스토리 미디어(`file`)는 넣지 않음 — 링 탭 시 `GET /main/stories?userNo=`.  
> **주민 스토리 조회** `GET /main/stories?userNo=`: 해당 유저 활성 스토리 배열(`created_at` ASC). **항목마다 `viewedByMe`**(스토리 단건 읽음, `ultary_story_view`). FileSummary 포함.  
> **FE 재생**: 배열은 시간순 유지. 시작 인덱스 = 첫 `viewedByMe === false` (없으면 `0` = 처음부터). 넘긴 뒤 `POST /stories/:storyId/view`로 읽음 기록.  
> 메인 피드: 본인 + 주민 게시글. `PUBLIC` / 본인 / `NEIGHBORS`(ACCEPTED). 차단 쌍 제외. 커서 `cursorFeedId` + `nextCursorFeedId`.  
> **추천 게시글** (`/main/feeds/recommended`, `/main/search/recommended`): 나중에 추천 알고리즘 추가해야함. 지금은 조회 가능한 전체 피드(공개·본인·이웃공개, 차단 제외)를 최신순 `limit`건(기본 10, 최대 20). 응답은 피드 단건과 같은 `FeedResponse` 배열. 주민 타임라인과 별개.  
> **작성자 프로필**: 항목마다 `authorProfileFile` (`FileSummary | null`). 작성자의 대표 펫 사진. 없으면 `null`. 게시글 사진(`media[].file`)과 별개. 단건 `GET /feeds/{feedId}`도 동일.  
> 검색 `type`: `ALL`(기본) \| `USER` \| `PET` \| `TAG` \| `FEED`. `@`/`#` 접두는 서버에서 제거. URL 쿼리에서는 `#`를 `%23`, `@`를 `%40`로 인코딩해야 함(`#`는 fragment라 미인코딩 시 `q`/`type`이 잘림). 차단 유저·펫 제외. **로그인한 본인 계정도 제외.** `users[]`에서 내 `userNo`를 빼고, `pets[]`에서 보호자가 나인 펫을 뺀다. `type=USER`(검색 페이지)와 `type=PET`(사진 태그·스토리 `@`)와 `type=ALL` 모두 같다. `PET`는 `mention_id`, 펫 이름, 보호자 닉네임. 스토리 `@`·사진 태그 후보도 이 검색으로 `petId`를 고른다.  
> **`pets[]`에 보호자 닉네임**: 각 펫에 `ownerNickname`(문자열). `userNo`는 보호자. 멘션명만 맞아도 닉네임이 있어야 목록에 `닉네임` + `@mentionId`를 같이 그린다. 없으면 펫 이름만 남는다.  
> **최근 검색**: 검색어가 아니라, 검색 후 들어간 유저 울타리. 검색창을 열면 `GET /main/search/recent` 5건(`items`, `nextCursorHistoryId`). 더보기는 그 커서로 `GET /main/search/recent/more?cursorHistoryId=` 20건. 또 남으면 응답 커서로 반복. `null`이면 끝. 항목은 `userNo`(울타리 주인), `nickname`, `profileFile`(대표 펫 사진, 없으면 null), `searchedAt`. 탈퇴·차단 유저는 목록에서 빠짐.  
> **저장**: 그 울타리에 들어갈 때 `POST /main/search/recent` `{ "targetUserNo" }`. 같은 울타리는 새 행 없이 `searched_at`만 갱신. 없는 유저 404, 차단 403.  
> **모두 지우기**: `DELETE /main/search/recent`. 내 행을 전부 삭제한다. 목록에 안 나오던 탈퇴·차단 대상도 포함. 응답 `data`는 null.  
> **최근 펫 태그** (`/main/pet-tags/recent`): 스토리 `@`와 사진 태그 모달의 「최근 태그」. **검색 최근 울타리와 다른 테이블**(`ultary_user_pet_tag_history`). `POST /main/search/recent`를 여기서 호출하지 않는다. 검색창 최근 목록에도 이 펫이 나오면 안 된다.  
> **목록**: 모달을 열면 `GET /main/pet-tags/recent`. `items` 최대 20, `usedAt` 내림차순. 커서 없음. 항목은 `petId`, `mentionId`, `name`, `userNo`(보호자), `ownerNickname`, `profileFile`(그 펫 사진, 없으면 null), `usedAt`. 비활성·삭제 펫, 탈퇴 보호자, 차단(내가 막음/상대가 막음)은 목록에서 뺀다.  
> **저장**: 멘션을 고를 때 `POST /main/pet-tags/recent` `{ "petId" }`. 같은 펫은 새 행 없이 `used_at`만 갱신. 없는 펫·비활성 펫 404, 차단 403.  
> **모두 지우기**: `DELETE /main/pet-tags/recent`. 내 행을 전부 삭제한다. 목록에 안 나오던 펫도 포함. 응답 `data`는 null.  
> **미디어 URL**: 피드·스토리 상세·프로필 등 읽기 응답에 `fileId`와 함께 `FileSummary` 임베드. `filePath`는 상대경로(`images/…`) 또는 CDN 절대 URL. `/main/stories/owners`는 스토리 미디어 없이 **`profileFile`만** 임베드. `/main/feeds` 항목은 게시글 `media[].file`과 함께 작성자 **`authorProfileFile`**.  
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
| 소개글 변경 | PATCH | `/api/my-ultary/bio` | `/api/v1/my-ultary/bio` | 구현 |
| 내 스토리 목록 | GET | `/api/my-ultary/stories` | `/api/v1/my-ultary/stories` | 구현 |
| 스토리 등록 | POST | `/api/my-ultary/stories` | `/api/v1/my-ultary/stories` | 구현 |
| 스토리 삭제 | DELETE | `/api/my-ultary/stories/:storyId` | `/api/v1/my-ultary/stories/:storyId` | 구현 |
| 스토리 읽음 | POST | `/api/stories/:storyId/view` | `/api/v1/stories/:storyId/view` | 구현 |

> 주민 = 팔로잉(`requester` ACCEPTED), 이웃 = 팔로워(`receiver` ACCEPTED).  
> 스토리: IMAGE\|VIDEO, `expires_at = created_at + 24h`. 읽음은 **스토리 단건** (`ultary_story_view`: `story_id`+`viewer_user_no`). 본인 스토리도 `POST /stories/{storyId}/view`로 기록한다. 목록 응답 `viewedByMe`.  
> **스토리 위 글자·멘션**: `POST /my-ultary/stories`의 `texts`, `mentions`. 조회(`GET /my-ultary/stories`, `GET /main/stories`)에도 같은 배열. `texts[]`: `content`(200자), `fontSize`(12\|16\|20\|24, 기본 16), `bold`, `underline`, `strikethrough`, `color`(`#RRGGBB`), `posX`/`posY`(0~100). `mentions[]`: `petId`(활성 펫), `posX`/`posY`. 응답 멘션은 `mentionId`, `petName` 포함. 후보 검색은 `GET /main/search?type=PET&q=` (닉네임·mention_id·펫 이름). 고른 펫은 `POST /main/pet-tags/recent`. 각 최대 20개. 배열 순서가 위아래.  
> **스토리 버튼**: `hasStory`, `hasUnviewed`. 기준은 조회한 나. `hasStory=false`면 없음, `hasUnviewed=true`면 안읽음, 스토리는 있는데 `hasUnviewed=false`면 다 읽음. 다른 사람 울타리(`GET /users/{userNo}/ultary`)도 같은 두 필드.  
> tagged-feeds: 다른 사람이 내 펫을 `COLLABORATOR`로 넣거나 사진에 `@` 멘션한 글. 내가 쓴 글은 제외.  
> **프로필 사진**: `profileFile`은 유저 컬럼이 아니다. 활성 펫 중 사진이 있는 것 가운데 `priority`가 가장 높은 펫. `PATCH /my-ultary/profile-image`는 제거. 사진은 `PATCH /pets/{petId}`의 `profileFileId`, 순서는 `priority`.  
> `GET /my-ultary/feeds`는 **로그인한 나의** 그리드다. 다른 사람 게시글 그리드는 `GET /users/{userNo}/feeds`.  
> HTTP: `requests/my-ultary.http` (시드 user 101 / `google-myultary-test-001`)

---

## 4. 반려동물

| 기능 | Method | BFF |
|------|--------|-----|
| 반려동물 목록 | GET | `/api/pets` |
| 반려동물 등록 | POST | `/api/pets` |
| 반려동물 수정 (name·mentionId 제외, priority 포함) | PATCH | `/api/pets/:petId` |
| mention_id 변경 가능 여부 | GET | `/api/pets/:petId/mention-id/change-availability` |
| mention_id 변경 (생성·변경 후 30일 쿨다운) | PATCH | `/api/pets/:petId/mention-id` |
| 반려동물 삭제 | DELETE | `/api/pets/:petId` |

> `name`은 생성 후 불변. 사진 `@` 멘션·공동작성은 승인/거절 없음. 멘션된 피드는 `GET /api/my-ultary/tagged-feeds`, 삭제는 작성자 또는 COLLABORATOR 펫 보호자.  
> **priority**: 작을수록 우선, 1이 가장 높음. `GET /pets`는 이 순서(같으면 petId). 생략하고 등록하면 맨 뒤(`MAX+1`).  
> **프로필 사진 교체**: `POST /files`로 새 파일을 만든 뒤 `PATCH /pets/{petId}`의 `profileFileId`로 연결. 빠지는 이전 파일은 `is_deleted=1`, `deleted_at` 설정. 다른 펫·피드·스토리·태그 이미지가 같은 파일을 쓰면 그 행은 유지. `removeProfileFile=true`도 같다.  
> `GET /pets`는 **로그인한 나의** 펫만 반환한다. 다른 사람 펫 목록은 `GET /users/{userNo}/pets`.  
> **유저로 보이는 프로필 사진**: 별도 컬럼 없음. 사진 있는 펫 중 priority가 가장 높은 `profileFile`이 Me / 마이울타리 / 이웃 / 검색 / 스토리 링 / 피드·댓글 작성자 사진. 없으면 null.

---

## 5. 게시글

| 기능 | Method | BFF |
|------|--------|-----|
| 게시글 등록 | POST | `/api/feeds` |
| 게시글 상세 | GET | `/api/feeds/:feedId` |
| 게시글 수정 | PATCH | `/api/feeds/:feedId` |
| 게시글 삭제 | DELETE | `/api/feeds/:feedId` |

> Spring: `GET /api/v1/feeds/{feedId}` — **PUBLIC은 비로그인 허용**. 상세는 [`spring-auth-api.md`](./spring-auth-api.md).
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
| 댓글 좋아요 | POST | `/api/feeds/:feedId/comments/:commentId/like` |
| 댓글 좋아요 취소 | DELETE | `/api/feeds/:feedId/comments/:commentId/like` |
| 답글 목록 | GET | `/api/feeds/:feedId/comments/:commentId/replies` |
| 답글 작성 | POST | `/api/feeds/:feedId/comments/:commentId/replies` |
| 답글 수정 | PATCH | `/api/feeds/:feedId/comments/:commentId/replies/:replyId` |
| 답글 삭제 | DELETE | `/api/feeds/:feedId/comments/:commentId/replies/:replyId` |
| 답글 좋아요 | POST | `/api/feeds/:feedId/comments/:commentId/replies/:replyId/like` |
| 답글 좋아요 취소 | DELETE | `/api/feeds/:feedId/comments/:commentId/replies/:replyId/like` |

> 댓글·답글 응답: `likeCount`, `likedByMe`, `authorProfileFile` (`FileSummary | null`, 작성자 프로필. 미등록이면 null). 목록에 답글이 포함되면 답글에도 동일. 좋아요 토글·작성·수정도 해당 댓글/답글 응답을 다시 반환. 테이블은 `ultary_feed_comment_like` / `ultary_feed_reply_like` (피드 좋아요와 분리).

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
| 해당 유저 펫 목록 | GET | `/api/users/:userNo/pets` | `/api/v1/users/:userNo/pets` | 구현 |
| 해당 유저 게시글 그리드 | GET | `/api/users/:userNo/feeds` | `/api/v1/users/:userNo/feeds` | 구현 |
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
> **스토리 버튼**: 응답에 `hasStory`, `hasUnviewed`. 그 사람의 활성 스토리를 **내가** 안 읽은 게 있으면 `hasUnviewed=true`. 없으면 다 읽음, 스토리 자체가 없으면 `hasStory=false`. 내 울타리와 같은 규칙.  
> **펫 목록** `GET /users/{userNo}/pets`: 그 유저의 활성 펫. 항목·정렬은 `GET /pets`와 같다 (`priority` 오름차순, 같으면 petId). `profileFile`, `priority` 포함. `GET /pets`는 나의 펫만 주므로 다른 사람 울타리에서 쓰면 안 된다.  
> **게시글 그리드** `GET /users/{userNo}/feeds`: 그 유저가 쓴 글. 항목은 `GET /my-ultary/feeds`와 같다 (`coverFile`, `coverThumbnailFile`). 쿼리는 `limit` 또는 `size` (기본 30, 최대 50). `GET /my-ultary/feeds`는 `limit`. `PUBLIC`은 조회 가능, `NEIGHBORS`는 ACCEPTED 이웃이거나 본인일 때만, `PRIVATE`는 그 `userNo` 본인만. 삭제된 글은 제외. `GET /my-ultary/feeds`는 나의 글만 주므로 다른 사람 울타리에서 쓰면 안 된다.  
> 경로의 `userNo`가 로그인한 본인이면 펫·게시글 목록은 각각 `GET /pets`, `GET /my-ultary/feeds`와 같은 결과다.  
> 차단 시 기존 neighbor 행 삭제. 상대가 나를 차단하면 울타리/목록 조회 `USER_BLOCKED`. 펫·게시글 목록도 같다.  
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

| 기능 | Method | BFF | Spring | 상태 |
|------|--------|-----|--------|------|
| 알림 목록 조회 | GET | `/api/notifications` | `/api/v1/notifications` | 구현 |
| 알림 단건 읽음 | PATCH | `/api/notifications/:notificationId/read` | `/api/v1/notifications/{notificationId}/read` | 구현 |
| 알림 전체 읽음 | POST | `/api/notifications/read-all` | `/api/v1/notifications/read-all` | 구현 |
| 스토리 공감 | POST | `/api/stories/:storyId/like` | `/api/v1/stories/{storyId}/like` | 구현 |
| 스토리 공감 취소 | DELETE | `/api/stories/:storyId/like` | `/api/v1/stories/{storyId}/like` | 구현 |

목록 `data`: `unreadCount`, `items`(기본 30, 최대 50, 쿼리 `limit`). 정렬은 마지막 행위 시각 내림차순. 항목: `type`, `message`, `actorUserNo`, `actorNickname`, `actorProfileFile`(대표 펫 사진, 없으면 null), `actorCount`, `snippet`(텍스트 일부, 최대 40자, 없으면 null), 이동용 `feedId` / `feedCommentId` / `feedReplyId` / `storyId` / `neighborId`, `neighborStatus`, `read`, `updatedAt`. `hasComment`·`hasReply`는 댓글·답글 통합 행만 의미 있다.

같은 대상은 알림 1행이다. `actorCount`가 2 이상이면 `message`는 «닉네임님 외 N명». 새 행위가 있으면 안 읽음으로 되돌리고 목록 맨 위로 올린다. 본인 행위, 탈퇴한 행위자, 서로 차단, 삭제된 게시글·스토리는 빠진다. 이웃 신청의 수락 버튼은 `neighborStatus=PENDING`일 때만. 수락 API는 기존 `POST /neighbors/{neighborId}/accept`.

| type | 생기는 때 | 모이는 단위 | 이동 |
|------|-----------|-------------|------|
| `NEIGHBOR_REQUEST` | 다른 유저가 나에게 이웃 신청 | 요청 1건 | `neighborId` |
| `FEED_LIKE` | 내 게시글 좋아요 | 그 게시글의 좋아요 | `feedId`. `snippet`은 본문 |
| `COMMENT_LIKE` | 내 댓글 좋아요 | 그 댓글의 좋아요 | `feedId`, `feedCommentId`. `snippet`은 댓글 |
| `REPLY_LIKE` | 내 답글 좋아요 | 그 답글의 좋아요 | `feedId`, `feedCommentId`, `feedReplyId`. `snippet`은 답글 |
| `FEED_COMMENT` | 내 게시글에 댓글 또는 답글 | 그 게시글의 댓글·답글 전부 | 최신 글의 `feedId`·`feedCommentId`·(답글이면) `feedReplyId`. `snippet`은 최신 글로 덮어씀. 댓글만 / 답글만 / 둘 다에 따라 `message`가 «게시글에 댓글을» · «댓글에 답글을» · «댓글, 답글을» |
| `COMMENT_MENTION` | 댓글에서 나 또는 내 펫 언급 | 그 댓글 | `feedId`, `feedCommentId` |
| `REPLY_MENTION` | 답글에서 나 또는 내 펫 언급 | 그 답글 | `feedId`, `feedCommentId`, `feedReplyId` |
| `FEED_TAG` | 게시글 사진 태그 또는 등장 펫이 내 펫 | 그 게시글·나 | `feedId`. `snippet`은 본문 |
| `STORY_TAG` | 스토리 `@`가 내 펫 | 그 스토리·나 | `storyId`. `snippet`은 캡션, 없으면 첫 글자 |
| `STORY_LIKE` | 내 스토리 공감 | 그 스토리의 공감 | `storyId` |

웹소켓은 아직 없다. 목록을 다시 조회하면 배지(`unreadCount`)와 문구를 맞춘다.

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

## 13. 로컬 테스트 전용 (`local` 프로필)

> Spring `@Profile("local")` — **prod 프로필에서는 컨트롤러 미등록(404)**.  
> FE는 development에서만 버튼/호출. BFF 경유 시에도 Spring이 local이어야 함.

| 기능 | Method | Spring | 비고 |
|------|--------|--------|------|
| 비밀번호 인코딩 | POST | `/api/v1/test/password/encode` | 인증 불필요 |
| **내 스토리 읽음 초기화** | DELETE | `/api/v1/test/story-views` | Bearer 필수. `ultary_story_view`에서 내 viewer 행 전부 삭제 → `deletedCount` |
| **닉네임 변경 기간 초기화** | POST | `/api/v1/test/nickname-cooldown` | Bearer 필수. 내 `nickname_changed_at`을 올해 1월 1일 00:00으로 바꿔 7일 쿨다운을 푼다 |

HTTP: `requests/test.http`

---

## 참고

- 코드 상수: `src/lib/api/endpoints.ts` (`bffEndpoints` / `springEndpoints`)
- BFF 스켈레톤: `src/app/api/**/route.ts`
- REST Client 틀: `http/bff.http` (프론트) · Spring: `requests/*.http`
- DB 스키마: `share/database/schema/mariadb_10_1/001_init_schema.sql` (**schema_version 14**)
  - 기존 DB v7→v8: `002_file_source_attribution.sql`
  - 기존 DB v8→v9: `003_comment_reply_like.sql`
  - 기존 DB v9→v10: `004_search_history_user_only.sql` (최근 검색 = 들어간 유저 울타리만)
  - 기존 DB v10→v11: `005_pet_priority_profile.sql` (펫 priority, 유저 profile_file_id 제거)
  - 기존 DB v11→v12: `006_story_overlay.sql` (스토리 글자·펫 멘션)
  - 기존 DB v12→v13: `007_recent_pet_tag.sql` (사진·스토리 최근 펫 태그. 검색 최근 울타리와 별도)
  - 기존 DB v13→v14: `008_notification.sql` (알림 집계, 스토리 공감)
  - `ultary_file` 출처: `source_type`(OWNED|UNSPLASH|AI|ETC), `author_name`, `source_url`, `license_url`, `copyright_notice`
- 로컬 시드(선택): `share/database/seed/mariadb_10_1/001_dev_sample_data.sql`  
  - 스키마 직후 실행. **재실행 가능**(CLEANUP 후 INSERT). 운영/최종 배포에서는 실행하지 않음.  
  - CDN 시드: `file_path` = `https://ehfqntuqntu.cdn1.cafe24.com/ultary/{filename}` (profile/post/story/goods). file_id **110~141**.  
  - 일반 업로드 파일은 `images/…`, `videos/…` (UPLOAD_DIR 상대경로).  
  - 시드 user **101~105** (펫 유저당 1~2). HTTP: `my-ultary` / `story` / `neighbor` → 101 (`google-myultary-test-001`)
- 입력 검사 공통 스펙: `share/validation/` (`rules.json`)

### 응답 임베드: FileSummary

목록·프로필·피드·스토리·태그 등 **fileId를 내려주던 읽기 API**는 동일 응답에 파일 요약을 포함한다.

```json
{
  "fileId": 120,
  "filePath": "https://ehfqntuqntu.cdn1.cafe24.com/ultary/post.jpg",
  "mimeType": "image/jpeg",
  "extension": "jpg",
  "sourceType": "OWNED",
  "authorName": null,
  "sourceUrl": null,
  "licenseUrl": null,
  "copyrightNotice": null
}
```

| 응답 | 필드 |
|------|------|
| Feed (`/main/feeds` 항목 · `GET /feeds/{feedId}`) | `authorProfileFile` (작성자 프로필. 없으면 null). 게시글 미디어와 별개 |
| 댓글·답글 (`GET /feeds/{id}/comments` · `.../replies`, 작성·수정·좋아요 응답) | `authorProfileFile` (작성자 프로필. 없으면 null). 목록에 답글이 포함되면 답글에도 동일 |
| Feed `media[]` | `file`, `thumbnailFile` (+ 기존 `fileId` / `thumbnailFileId`) |
| Feed 그리드 | `coverFile`, `coverThumbnailFile` |
| Story | `file`, `thumbnailFile`, `authorProfileFile` |
| StoryOwner (`/main/stories/owners`) | `profileFile` (대표 펫 사진. 없으면 null). 스토리 미디어는 없음 |
| Me / MyUltary / UserUltary / Neighbor / Search / 최근 검색 | `profileFile` (대표 펫 사진. 없으면 null) |
| Feed · 댓글 · 답글 · Story | `authorProfileFile` (작성자의 대표 펫 사진. 없으면 null) |
| Pet | `profileFile`, `priority` (작을수록 우선) |
| Tag | `images[]` (+ 기존 `imageFileIds`) |

- `filePath`가 `http(s)://` 이면 FE가 **그대로** `<img src>` (CDN).  
- 상대경로면 `GET /api/v1/files/{fileId}/content` (또는 BFF 프록시). CDN 절대경로에 `/content` 호출은 하지 않음.  
- 업로드·단건 메타는 계속 `POST/GET /api/v1/files`.

### Spring 구현 진행 (BE)

| Phase | 내용 | 비고 |
|-------|------|------|
| 1-7 | Auth / File / Pet | 완료 |
| 1-8 | Tag | 완료 |
| 1-9 | Feed (+ 성공 메시지) | 완료 |
| 1-10 | MyUltary + Story (스키마 v7) | HTTP 스모크 테스트함. **최종 E2E는 별도 재검증 예정** |
| 1-11 | Neighbor (+ block, NEIGHBORS 피드 가시성) | 스모크 테스트함. 시드 user 5·pet 1~2. HTTP `neighbor.http` |
| 1-12 | Main feeds/search | 타임라인 커서 + 통합 검색. HTTP `main.http` |
| 1-13 | 알림 저장·목록, 스토리 공감 | 화면 10종. 웹소켓은 아직 없음 |
| 다음 | DM, 알림 웹소켓 | 미착수 |

파일 업로드 상대경로: `images/{uuid}.ext`, `videos/{uuid}.ext` (`UPLOAD_DIR`).  
시드 CDN·임베드 요약은 위 **FileSummary** 절 참고.
