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
| 휴대폰 인증 | POST | `/api/auth/phone` | `/api/v1/auth/phone` | 발송 전에 번호 중복. `purpose` 생략·`SIGNUP`은 가입된 번호 거절. `PROFILE`은 Bearer 필수, 내 번호만 허용. `PASSWORD`는 재설정이라 가입된 번호로 발송 |
| 휴대폰 인증 확인 | POST | `/api/auth/phone/verify` | `/api/v1/auth/phone/verify` |
| 비밀번호 변경 토큰 생성 | POST | `/api/auth/password/token` | `/api/v1/auth/password/token` |
| 비밀번호 변경 | PUT | `/api/auth/password` | `/api/v1/auth/password` |
| 로그인 중 비밀번호 변경 | PUT | `/api/auth/password/me` | `/api/v1/auth/password/me` |
| 구글 소셜 로그인 시작 (BFF OAuth) | GET | `/api/auth/social/google` | — |
| 구글 소셜 콜백 (BFF→Spring) | GET | `/api/auth/social/google/callback` | `POST /api/v1/auth/social/login` |
| 카카오 소셜 로그인 시작 (BFF OAuth) | GET | `/api/auth/social/kakao` | — |
| 카카오 소셜 콜백 (BFF→Spring) | GET | `/api/auth/social/kakao/callback` | `POST /api/v1/auth/social/login` |
| 소셜 계정 연동 | POST | `/api/auth/social/link` | `/api/v1/auth/social/link` |
| 소셜 계정 연동 해제 | DELETE | `/api/auth/social/unlink` | `/api/v1/auth/social/unlink` |

연락처를 바꿀 때만 `PATCH /auth/me`에 `phone`(숫자만)과 `phoneAuthCompleteToken`(인증 확인 응답)을 보낸다. 토큰에 들어 있는 번호와 같을 때만 저장한다. 인증번호 발송(`purpose=PROFILE`)에서 이미 다른 사람 번호면 `PHONE_ALREADY_USED`.

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

탈퇴 계정(`WITHDRAWN`)으로 이메일·휴대폰 로그인 또는 소셜 로그인을 하면 `403`, code `ACCOUNT_WITHDRAWN`, message `탈퇴된 계정입니다.` 정지 계정(`SUSPENDED`)은 `403`, code `ACCOUNT_SUSPENDED`, message `정지된 계정입니다.` 이미 발급된 액세스 토큰의 다음 요청과 리프레시도 같은 코드다. 비밀번호가 틀린 활성 계정은 `LOGIN_FAILED`.

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
| 검색 (닉네임 / 펫멘션 / 태그명) | GET | `/api/main/search` | `/api/v1/main/search` | 구현 |
| 태그 게시글 그리드 | GET | `/api/main/search/tags/:tagId/feeds?limit=30` | `/api/v1/main/search/tags/{tagId}/feeds?limit=30` | 구현 |
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
> **주민 스토리 조회** `GET /main/stories?userNo=`: 해당 유저 활성 스토리 배열(`created_at` ASC). **항목마다 `viewedByMe`**(스토리 단건 읽음, `ultary_story_view`)와 **`likedByMe`**(내 공감, 취소한 건 제외). FileSummary 포함. `GET /my-ultary/stories`, `POST /stories/{storyId}/view`도 같다.  
> **FE 재생**: 배열은 시간순 유지. 시작 인덱스 = 첫 `viewedByMe === false` (없으면 `0` = 처음부터). 넘긴 뒤 `POST /stories/:storyId/view`로 읽음 기록.  
> 메인 피드: 본인 + 주민 게시글. `PUBLIC` / 본인 / `NEIGHBORS`(ACCEPTED). 차단 쌍 제외. 커서 `cursorFeedId` + `nextCursorFeedId`.  
> **추천 게시글** (`/main/feeds/recommended`, `/main/search/recommended`): 나중에 추천 알고리즘 추가해야함. 지금은 조회 가능한 전체 피드(공개·본인·이웃공개, 차단 제외)를 최신순 `limit`건(기본 10, 최대 20). 응답은 피드 단건과 같은 `FeedResponse` 배열. 주민 타임라인과 별개.  
> **작성자 프로필**: 항목마다 `authorProfileFile` (`FileSummary | null`). 작성자의 대표 펫 사진. 없으면 `null`. 게시글 사진(`media[].file`)과 별개. 단건 `GET /feeds/{feedId}`도 동일.  
> 검색 페이지 `GET /main/search?q=&type=&limit=`. `@`/`#` 접두는 서버에서 제거. URL 쿼리에서는 `#`를 `%23`, `@`를 `%40`로 인코딩해야 함. 입력 중과 엔터는 같은 응답이고 `limit`만 다르다. 입력 중 `limit=5`, 엔터 `limit=20`.  
> **검색 페이지**: `type=USER`는 닉네임 → `users[]`. `type=MENTION`은 펫 멘션 → `users[]`(유저당 한 줄, `petTags`). `type=TAG`는 태그명 → `tags[]`(`tagId`, `hashtag`, `feedCount`). `users[]` 항목은 `userNo`, `nickname`, `profileFile`, `petTags`, `bio`. `petTags`는 mentionId 배열(`@` 없음, priority 순, 없으면 `[]`). 본인·차단 유저는 빠진다. `tags[].feedCount`는 태그 클릭 그리드와 같은, 그 조회자에게 보이는 게시글 수다.  
> **태그 클릭** `GET /main/search/tags/{tagId}/feeds?limit=30`. 보이는 글만 그리드, 최신순. 항목은 마이울타리 그리드와 같다(`feedId`, `coverFile`, `coverThumbnailFile`, `coverMediaType`, `mediaCount`, `likeCount`, `commentCount`, `createdAt`). 없는 태그 404.  
> `type=PET`는 스토리 `@` 후보용이다. 검색 페이지에서 쓰지 않는다. `pets[]`에 `petId`가 있다. `mention_id`, 펫 이름, 보호자 닉네임. 본인 펫·차단은 빠진다. `type=FEED`는 게시글 본문 검색(`feeds[]`, 피드 단건과 같은 응답). `type=ALL`은 USER+PET+TAG+FEED.  
> **`pets[]`에 보호자 닉네임**: 각 펫에 `ownerNickname`(문자열). `userNo`는 보호자. 멘션명만 맞아도 닉네임이 있어야 목록에 `닉네임` + `@mentionId`를 같이 그린다. 없으면 펫 이름만 남는다.  
> **최근 검색**: 검색어가 아니라, 검색 후 들어간 유저 울타리. 검색창을 열면 `GET /main/search/recent` 5건(`items`, `nextCursorHistoryId`). 더보기는 그 커서로 `GET /main/search/recent/more?cursorHistoryId=` 20건. 또 남으면 응답 커서로 반복. `null`이면 끝. 항목은 `userNo`(울타리 주인), `nickname`, `profileFile`(대표 펫 사진, 없으면 null), `petTags`, `searchedAt`. `petTags`는 그 주인 펫의 `mentionId` 문자열 배열이다. `@`는 붙이지 않고, `priority` 순이다. 펫이 없으면 `[]`. 화면에는 각 `mentionId` 앞에 `@`를 붙여 한 줄로 나열한다. 탈퇴·차단 유저는 목록에서 빠짐.  
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
| 울타리에 고정한 게시글 | GET | `/api/my-ultary/pinned-feeds` | `/api/v1/my-ultary/pinned-feeds` | 구현 |
| 나만 보는 저장 게시글 | GET | `/api/my-ultary/saved-feeds` | `/api/v1/my-ultary/saved-feeds` | 구현 |
| 자신이 태그된 게시글 조회 | GET | `/api/my-ultary/tagged-feeds` | `/api/v1/my-ultary/tagged-feeds` | 구현 |
| 소개글 변경 | PATCH | `/api/my-ultary/bio` | `/api/v1/my-ultary/bio` | 구현 |
| 내 스토리 목록 | GET | `/api/my-ultary/stories` | `/api/v1/my-ultary/stories` | 구현 |
| 스토리 등록 | POST | `/api/my-ultary/stories` | `/api/v1/my-ultary/stories` | 구현 |
| 스토리 삭제 | DELETE | `/api/my-ultary/stories/:storyId` | `/api/v1/my-ultary/stories/:storyId` | 구현 |
| 스토리 읽음 | POST | `/api/stories/:storyId/view` | `/api/v1/stories/:storyId/view` | 구현 |

> 주민 = 팔로잉(`requester` ACCEPTED), 이웃 = 팔로워(`receiver` ACCEPTED).  
> 스토리: IMAGE\|VIDEO, `expires_at = created_at + 24h`. 읽음은 **스토리 단건** (`ultary_story_view`: `story_id`+`viewer_user_no`). 본인 스토리도 `POST /stories/{storyId}/view`로 기록한다. 목록·읽음 응답에 `viewedByMe`, `likedByMe`.  
> **스토리 위 글자·멘션**: `POST /my-ultary/stories`의 `texts`, `mentions`. 조회(`GET /my-ultary/stories`, `GET /main/stories`)에도 같은 배열. `texts[]`: `content`(200자), `fontSize`(12\|16\|20\|24, 기본 16), `bold`, `underline`, `strikethrough`, `color`(`#RRGGBB`), `posX`/`posY`(0~100). `mentions[]`: `petId`(활성 펫), `posX`/`posY`. 응답 멘션은 `mentionId`, `petName` 포함. 후보 검색은 `GET /main/search?type=PET&q=` (닉네임·mention_id·펫 이름). 고른 펫은 `POST /main/pet-tags/recent`. 각 최대 20개. 배열 순서가 위아래.  
> **스토리 버튼**: `hasStory`, `hasUnviewed`. 기준은 조회한 나. `hasStory=false`면 없음, `hasUnviewed=true`면 안읽음, 스토리는 있는데 `hasUnviewed=false`면 다 읽음. 다른 사람 울타리(`GET /users/{userNo}/ultary`)도 같은 두 필드.  
> tagged-feeds: 다른 사람이 내 펫을 `COLLABORATOR`로 넣거나 사진에 `@` 멘션한 글. 내가 쓴 글은 제외.  
> **프로필 사진**: `profileFile`은 유저 컬럼이 아니다. 활성 펫 중 사진이 있는 것 가운데 `priority`가 가장 높은 펫. `PATCH /my-ultary/profile-image`는 제거. 사진은 `PATCH /pets/{petId}`의 `profileFileId`, 순서는 `priority`.  
> `GET /my-ultary/feeds`는 **로그인한 나의** 그리드다. 다른 사람 게시글 그리드는 `GET /users/{userNo}/feeds`. 고정·태그 탭도 같다. 다른 사람 것은 `GET /users/{userNo}/pinned-feeds`, `GET /users/{userNo}/tagged-feeds`. `GET /my-ultary/saved-feeds`는 나만 보는 저장이라 다른 사람 울타리에 없다.  
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
| 게시글 고정 (울타리에 표시) | POST | `/api/feeds/:feedId/pin` |
| 게시글 고정 해제 | DELETE | `/api/feeds/:feedId/pin` |
| 게시글 저장 (나만 보기) | POST | `/api/feeds/:feedId/save` |
| 게시글 저장 해제 | DELETE | `/api/feeds/:feedId/save` |
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

> 태그 클릭 `GET /api/v1/tags/{tagId}`의 `data.feedCount`는 그 태그가 달린 게시글 수다. 지금 보고 있는 글은 포함하고, 삭제된 글은 뺀다. 다른 게시글보기 버튼은 `feedCount > 1`일 때만 보이고, 숫자는 `feedCount - 1`이다. `useCount`는 쓰지 않는다.

> 해시태그 / 반려동물 태그명 / 관리자 검수 대상 태그는 구현 시 구분한다.

---

## 7. 다른 유저 울타리 · 관계

| 기능 | Method | BFF | Spring | 상태 |
|------|--------|-----|--------|------|
| 해당 유저 울타리 정보 | GET | `/api/users/:userNo/ultary` | `/api/v1/users/:userNo/ultary` | 구현 |
| 해당 유저 펫 목록 | GET | `/api/users/:userNo/pets` | `/api/v1/users/:userNo/pets` | 구현 |
| 해당 유저 게시글 그리드 | GET | `/api/users/:userNo/feeds` | `/api/v1/users/:userNo/feeds` | 구현 |
| 해당 유저가 고정한 게시글 | GET | `/api/users/:userNo/pinned-feeds` | `/api/v1/users/:userNo/pinned-feeds` | 구현 |
| 해당 유저가 태그된 게시글 | GET | `/api/users/:userNo/tagged-feeds` | `/api/v1/users/:userNo/tagged-feeds` | 구현 |
| 주민·이웃 목록 | GET | `/api/users/:userNo/neighbors` | `/api/v1/users/:userNo/neighbors?type=` | 구현 |
| 주민(이웃) 요청 | POST | `/api/users/:userNo/neighbors/request` | `/api/v1/users/:userNo/neighbors/request` | 구현 |
| 주민 요청 수락 | POST | `/api/neighbors/:neighborId/accept` | `/api/v1/neighbors/:neighborId/accept` | 구현 |
| 주민 요청 거절 | POST | `/api/neighbors/:neighborId/reject` | `/api/v1/neighbors/:neighborId/reject` | 구현 |
| 주민 요청 취소 · 이웃 해제 | DELETE | `/api/neighbors/:neighborId` | `/api/v1/neighbors/:neighborId` | 구현 |
| 유저 차단 | POST | `/api/users/:userNo/block` | `/api/v1/users/:userNo/block` | 구현 |
| 차단한 사용자 목록 | GET | `/api/users/blocks` | `/api/v1/users/blocks` | 구현 |
| 유저 차단 해제 | DELETE | `/api/users/:userNo/block` | `/api/v1/users/:userNo/block` | 구현 |
| 신고 | POST | `/api/reports` | — | 미구현 |

> `type=RESIDENTS`(주민/팔로잉, 기본) · `type=NEIGHBORS`(이웃/팔로워).  
> `pair_key` = `minUserNo:maxUserNo` (한 쌍에 관계 행 1개).  
> `relationStatus`: `NONE` \| `PENDING_SENT` \| `PENDING_RECEIVED` \| `ACCEPTED` \| `REJECTED` \| `BLOCKED`.  
> **스토리 버튼**: 응답에 `hasStory`, `hasUnviewed`. 그 사람의 활성 스토리를 **내가** 안 읽은 게 있으면 `hasUnviewed=true`. 없으면 다 읽음, 스토리 자체가 없으면 `hasStory=false`. 내 울타리와 같은 규칙.  
> **펫 목록** `GET /users/{userNo}/pets`: 그 유저의 활성 펫. 항목·정렬은 `GET /pets`와 같다 (`priority` 오름차순, 같으면 petId). `profileFile`, `priority` 포함. `GET /pets`는 나의 펫만 주므로 다른 사람 울타리에서 쓰면 안 된다.  
> **게시글 그리드** `GET /users/{userNo}/feeds`: 그 유저가 쓴 글. 항목은 `GET /my-ultary/feeds`와 같다 (`coverFile`, `coverThumbnailFile`). 쿼리는 `limit` 또는 `size` (기본 30, 최대 50). `GET /my-ultary/feeds`는 `limit`. `PUBLIC`은 조회 가능, `NEIGHBORS`는 ACCEPTED 이웃이거나 본인일 때만, `PRIVATE`는 그 `userNo` 본인만. 삭제된 글은 제외. `GET /my-ultary/feeds`는 나의 글만 주므로 다른 사람 울타리에서 쓰면 안 된다.
> **고정한 글** `GET /users/{userNo}/pinned-feeds`, **태그된 글** `GET /users/{userNo}/tagged-feeds`: 항목·쿼리는 게시글 그리드와 같다. 경로의 `userNo`가 본인이면 `GET /my-ultary/pinned-feeds`, `GET /my-ultary/tagged-feeds`와 같다. 다른 사람이 볼 때는 그 글 작성자 기준으로 보이는 글만 남긴다. 비공개 계정은 전체 공개도 이웃만, `PRIVATE`는 작성자만, 서로 차단이거나 탈퇴한 작성자의 글은 빠진다. 태그된 글은 그 유저가 쓴 글은 제외하고, 그 유저 펫이 공동작성(`COLLABORATOR`)이거나 사진에 `@`된 글이다. 나만 보는 저장(`ultary_feed_save`)은 다른 사람 경로가 없다.  
> 경로의 `userNo`가 로그인한 본인이면 펫·게시글 목록은 각각 `GET /pets`, `GET /my-ultary/feeds`와 같은 결과다.  
> 차단 시 기존 neighbor 행 삭제. 상대가 나를 차단하면 울타리/목록 조회 `USER_BLOCKED`. 펫·게시글 목록도 같다.  
> **차단한 사용자** `GET /users/blocks`: 내가 차단한 활성 유저만. 배열. 기본 30, 최대 50, 쿼리 `limit`. 최신 `blockedAt` 순. 항목은 `userNo`, `nickname`, `profileFile`(대표 펫 사진, 없으면 null), `blockedAt`. 탈퇴한 유저는 빠진다. 화면의 취소는 해제 전 확인이라 응답에 없다. 해제는 `DELETE /users/{userNo}/block`.  
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

| 기능 | Method | BFF | Spring | 상태 |
|------|--------|-----|--------|------|
| 메시지(대화방) 리스트 | GET | `/api/dm/rooms` | `/api/v1/dm/rooms` | 구현 |
| 대화방 생성 | POST | `/api/dm/rooms` | `/api/v1/dm/rooms` | 구현 |
| 대화방 나가기 | DELETE | `/api/dm/rooms/:roomId` | `/api/v1/dm/rooms/{roomId}` | 구현 |
| 읽음 처리 | POST | `/api/dm/rooms/:roomId/read` | `/api/v1/dm/rooms/{roomId}/read` | 구현 |
| 대화방 보는 중 | POST | `/api/dm/rooms/:roomId/viewing` | `/api/v1/dm/rooms/{roomId}/viewing` | 구현 |
| 입력 중 | POST | `/api/dm/rooms/:roomId/typing` | `/api/v1/dm/rooms/{roomId}/typing` | 구현 |
| 대화방 메시지 조회 | GET | `/api/dm/rooms/:roomId/messages` | `/api/v1/dm/rooms/{roomId}/messages` | 구현 |
| 메시지 전송 | POST | `/api/dm/rooms/:roomId/messages` | `/api/v1/dm/rooms/{roomId}/messages` | 구현 |

> 1:1. 같은 두 사람은 방 1개(`pair_key`). 주민·이웃(`ACCEPTED`)만 만들고 보낼 수 있다. 차단이면 `USER_BLOCKED`.
> **대화 상대 고르기**는 울타리 목록과 같다. `GET /users/{내 userNo}/neighbors?type=RESIDENTS`(주민), `type=NEIGHBORS`(이웃). 항목의 `userNo`로 `POST /dm/rooms` `{ targetUserNo }`.
> 목록 `items`(기본 30, 최대 50). 최신 메시지 순. `peerUserNo`, `peerNickname`, `profileFile`(대표 펫 사진, 없으면 null), `lastMessage`, `lastMessageAt`, `unreadCount`. 글이 있으면 그 글, 공유만 있으면 «게시글을 공유했습니다» / «스토리를 공유했습니다». 나간 방, 탈퇴·차단 상대는 빠진다.
> 메시지 `items`는 오래된 순. `beforeMessageId`로 더 이전. `nextCursorMessageId`가 있으면 그 값으로 이어서 조회. `peerLastReadMessageId`는 상대가 읽은 마지막 메시지 번호이고, 아직 없으면 null. 조회하면 그 방의 최신 메시지까지 읽음. `fromMe`, `body`(없으면 null), `createdAt`. 화면의 «방금/어제»는 `createdAt`으로 그린다. 헤더 «울타리»는 `peerUserNo`.
> **보는 중** `{ viewing: true }` 를 방에 들어온 뒤 약 10초마다 보낸다. 20초 동안 없으면 나간 것으로 본다. `{ viewing: false }` 는 방을 나갈 때. 둘 다 이 방을 보고 있으면, 한쪽이 보낸 메시지는 그 자리에서 상대가 읽은 것으로 기록된다.
> **입력 중** `{ typing: true }` / `{ typing: false }`. 저장하지 않는다. true 이후 4초 안에 다시 true가 없으면 멈춘 것으로 본다. 메시지를 보내면 입력 중은 끝난다.
> **게시글 공유** `{ body, feedId, feedMediaId }`. `feedMediaId`는 캐러셀에서 고른 사진. 없으면 첫 장. 응답 `share.type=FEED`, `mediaIndex`(0이 첫 장), `authorUserNo`, `authorNickname`, `authorProfileFile`, `file`(그 사진. 영상이면 썸네일), `content`(본문). 보낸 사람이 그 글을 볼 수 있어야 한다.
> **스토리 공유** `{ body, storyId }`. `share.type=STORY`, `file`만. 프로필·닉네임 없음. 활성 스토리만 보낼 수 있고, 받은 뒤에는 만료돼도 그 사진을 보여 준다.
> 게시글과 스토리는 한 메시지에 같이 못 보낸다. 삭제된 대상은 `share.available=false`이고 사진·본문은 null. 상대가 답장을 보내면 나간 방이 다시 목록에 나온다.
> 보내기는 이 POST를 그대로 쓴다. 상대(와 내 다른 탭)에는 웹소켓 `DM_MESSAGE`가 간다. [웹소켓](#웹소켓).

### 웹소켓

입장 토큰 `POST /api/v1/ws/ticket` (Bearer). `data.ticket`, `expiresIn` 30초, 한 번만 쓸 수 있다. BFF가 쿠키로 이 API를 호출하고, 브라우저 소켓은 Next를 거치지 않고 Spring `ws://localhost:9377/api/v1/ws`(운영은 `wss`)로 연다. Origin 기본값은 `http://localhost:3000`.

연결되면 5초 안에 첫 텍스트로 `{ "type": "AUTH", "ticket": "..." }` 를 보낸다. 맞으면 `{ "type": "AUTH_OK" }` 다음에 현재 배지 `{ "type": "NOTIFICATION_UNREAD", "unreadCount" }`. 틀리거나 늦으면 연결이 끊긴다. 서버는 25초마다 `{ "type": "PING" }` 을 보낸다.

알림이 생기거나 읽히면 같은 `NOTIFICATION_UNREAD`가 간다. DM을 보내면 양쪽 탭에 `{ "type": "DM_MESSAGE", "dmRoomId", "room", "message" }`. `room`은 대화방 목록 한 줄, `message`는 메시지 한 건이고 `fromMe`는 그 소켓 주인 기준이다.

읽음이 올라가면 읽은 사람이 아닌 상대에게만 `{ "type": "DM_READ", "dmRoomId", "lastReadMessageId" }`. 메시지 조회, `POST .../read`, 메시지 전송, 보는 중 true가 이 경로다. 입력 중은 입력한 사람이 아닌 상대에게만 `{ "type": "DM_TYPING", "dmRoomId", "userNo", "typing" }`. 소켓이 끊기면 그 사람의 보는 중·입력 중은 지워진다. 보내기·목록·읽음 HTTP는 그대로다.

---

## 10. 알림

| 기능 | Method | BFF | Spring | 상태 |
|------|--------|-----|--------|------|
| 안 읽은 알림 수 | GET | `/api/notifications/unread-count` | `/api/v1/notifications/unread-count` | 구현 |
| 알림 목록 조회 | GET | `/api/notifications` | `/api/v1/notifications` | 구현 |
| 알림 단건 읽음 | PATCH | `/api/notifications/:notificationId/read` | `/api/v1/notifications/{notificationId}/read` | 구현 |
| 알림 전체 읽음 | POST | `/api/notifications/read-all` | `/api/v1/notifications/read-all` | 구현 |
| 스토리 공감 | POST | `/api/stories/:storyId/like` | `/api/v1/stories/{storyId}/like` | 구현 |
| 스토리 공감 취소 | DELETE | `/api/stories/:storyId/like` | `/api/v1/stories/{storyId}/like` | 구현 |

목록 `data`: `unreadCount`, `items`(기본 30, 최대 50, 쿼리 `limit`). 정렬은 마지막 행위 시각 내림차순. 항목: `type`, `message`, `actorUserNo`, `actorNickname`, `actorProfileFile`(대표 펫 사진, 없으면 null), `actorCount`, `snippet`(텍스트 일부, 최대 40자, 없으면 null), 이동용 `feedId` / `feedCommentId` / `feedReplyId` / `storyId` / `neighborId`, `neighborStatus`, `read`, `updatedAt`. `hasComment`·`hasReply`는 댓글·답글 통합 행만 의미 있다.

같은 대상은 알림 1행이다. `actorCount`가 2 이상이면 `message`는 «닉네임님 외 N명». 새 행위가 있으면 안 읽음으로 되돌리고 목록 맨 위로 올린다. 본인 행위, 탈퇴한 행위자, 서로 차단, 삭제된 게시글·스토리는 빠진다. 알림 설정에서 끈 종류도 목록과 `unreadCount`에서 빠지고, 그 사이 생긴 알림은 저장하지 않는다. 이웃 신청의 수락 버튼은 `neighborStatus=PENDING`일 때만. 수락 API는 기존 `POST /neighbors/{neighborId}/accept`.

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

하단 배지는 `unreadCount`만 쓴다. `/auth/me`에 넣지 않는다. 처음 숫자와 소켓이 끊긴 동안은 `GET /notifications/unread-count`. 이 조회는 읽음 처리하지 않아서, 알림 페이지에 들어오기 전까지 숫자가 쌓인다. 알림 페이지의 `GET /notifications`는 목록을 만든 뒤 그때까지 안 읽은 알림을 읽음으로 바꾼다. 그 다음 배지는 0이고, 새 행위가 있으면 다시 안 읽음으로 쌓인다. 연결되어 있으면 같은 숫자를 `NOTIFICATION_UNREAD`로 밀어 준다. [웹소켓](#웹소켓).

---

## 11. 설정

| 기능 | Method | BFF |
|------|--------|-----|
| 설정 조회 (프로필 공개 범위 등) | GET | `/api/settings` |
| 설정 변경 | PATCH | `/api/settings` |

| 기능 | Method | BFF | Spring | 상태 |
|------|--------|-----|--------|------|
| 내 활동 | GET | `/api/settings/activities` | `/api/v1/settings/activities` | 구현 |
| 알림 설정 조회 | GET | `/api/settings/notifications` | `/api/v1/settings/notifications` | 구현 |
| 알림 설정 변경 | PATCH | `/api/settings/notifications` | `/api/v1/settings/notifications` | 구현 |
| 공개 범위 조회 | GET | `/api/settings/privacy` | `/api/v1/settings/privacy` | 구현 |
| 공개 범위 변경 | PATCH | `/api/settings/privacy` | `/api/v1/settings/privacy` | 구현 |

내가 한 일만. `data.items`(기본 30, 최대 50, 쿼리 `limit`). 최신 `occurredAt` 순. 별도 로그 테이블 없이 좋아요·댓글·답글·이웃 신청·게시글·스토리를 합친다. 삭제된 글, 탈퇴한 대상은 빠진다. 만료된 스토리도 올린 기록으로 남는다.

항목: `type`, `occurredAt`, `targetUserNo`, `targetNickname`, `profileFile`(그 유저의 대표 펫 사진, 없으면 null), `snippet`(미리보기 원문. 화면에서 6자로 자른다. 없으면 null), 이동용 `feedId` / `feedCommentId` / `feedReplyId` / `storyId` / `neighborId`, `neighborStatus`.

| type | 화면 | 대상 닉네임 | snippet | 이동 |
|------|------|-------------|---------|------|
| `FEED_LIKE` | OO님의 게시글에 좋아요 | 게시글 작성자 | 게시글 본문 | `feedId` |
| `COMMENT_LIKE` | OO님의 댓글에 좋아요 | 댓글 작성자 | 댓글 | `feedId`, `feedCommentId` |
| `REPLY_LIKE` | OO님의 답글에 좋아요 | 답글 작성자 | 답글 | `feedId`, `feedCommentId`, `feedReplyId` |
| `FEED_COMMENT` | OO님의 게시글에 댓글 | 게시글 작성자 | 내가 쓴 댓글 | `feedId`, `feedCommentId` |
| `FEED_REPLY` | OO님의 댓글에 답글 | 댓글 작성자 | 내가 쓴 답글 | `feedId`, `feedCommentId`, `feedReplyId` |
| `NEIGHBOR_REQUEST` | OO님에게 이웃을 신청 | 받은 사람 | 없음 | `neighborId`. `PENDING`이면 취소 `DELETE /neighbors/{neighborId}`. `ACCEPTED`·`REJECTED`는 버튼 없음 |
| `FEED` | 게시글을 올렸습니다 | 나 | 본문 | `feedId` |
| `STORY` | 스토리를 올렸습니다 | 나 | 캡션 | `storyId` |

**알림 설정** `GET`/`PATCH /settings/notifications`. 행이 없으면 전부 `true`. PATCH는 넣은 필드만 바꾼다. 하나도 없으면 `400`. 끈 종류는 알림 목록에 안 나오고, 그때 생긴 알림은 저장하지 않는다. 다시 켜면 그 전에 저장된 알림은 다시 보인다.

| 필드 | 화면 | 알림 type |
|------|------|-----------|
| `neighbor` | 이웃 신청 | `NEIGHBOR_REQUEST` |
| `likePost` | 게시글 좋아요 | `FEED_LIKE` |
| `likeComment` | 댓글 좋아요 | `COMMENT_LIKE` |
| `likeReply` | 답글 좋아요 | `REPLY_LIKE` |
| `commentOnPost` | 내 게시글 댓글 | `FEED_COMMENT`의 댓글 |
| `replyOnComment` | 내 댓글 답글 | `FEED_COMMENT`의 답글 |
| `mention` | 댓글·답글 언급 | `COMMENT_MENTION`, `REPLY_MENTION` |
| `tagPost` | 게시글 태그 | `FEED_TAG` |
| `tagStory` | 스토리 태그 | `STORY_TAG` |
| `storyReact` | 스토리 공감 | `STORY_LIKE` |

**공개 범위** `GET`/`PATCH /settings/privacy`. 행이 없으면 비공개 계정 꺼짐, `feedVisibility=PUBLIC`, `storyVisibility=NEIGHBORS`, 이웃 신청·댓글·멘션·태그 켜짐. PATCH는 넣은 필드만. `feedVisibility`·`storyVisibility`는 `PUBLIC` | `NEIGHBORS` | `PRIVATE`.

| 필드 | 화면 | 적용 |
|------|------|------|
| `privateAccount` | 비공개 계정 | 켜면 전체 공개 게시글·스토리도 이웃만 본다. 저장된 기본값은 그대로 |
| `feedVisibility` | 게시글 기본 공개 범위 | 글을 쓸 때 공개 범위를 비우면 이 값 |
| `storyVisibility` | 스토리 공개 범위 | `PRIVATE`는 본인만. `PUBLIC`는 이웃이 아니어도 본다 |
| `neighborRequest` | 이웃 신청 받기 | 끄면 신청 `403` `NEIGHBOR_REQUEST_CLOSED` |
| `allowComment` | 게시글 댓글 허용 | 끄면 남의 댓글·답글 `403` `COMMENT_NOT_ALLOWED`. 본인 글은 가능 |
| `allowMention` | 멘션 허용 | 끄면 댓글·답글에서 그 사람·그 펫 멘션 `403` `MENTION_NOT_ALLOWED` |
| `allowTag` | 태그 허용 | 끄면 게시글·스토리에서 그 펫 태그 `403` `TAG_NOT_ALLOWED` |

---

## 12. 관리자

| 기능 | Method | BFF |
|------|--------|-----|
| 태그 승인 | POST | `/api/admin/tags/:tagId/approve` |
| 태그 거절 | POST | `/api/admin/tags/:tagId/reject` |
| 회원 정지 | POST | `/api/admin/users/:userNo/suspend` |
| 회원 정지 해제 | POST | `/api/admin/users/:userNo/unsuspend` |

회원 정지는 `withdrawal_status=SUSPENDED`, `suspended_at=지금`. 리프레시 토큰은 폐기한다. 응답 `data`는 `userNo`, `withdrawalStatus`, `suspendedAt`. 없는 회원 `404` `USER_NOT_FOUND`. 이미 정지면 `409` `ACCOUNT_ALREADY_SUSPENDED`. 탈퇴 계정이면 `409` `CANNOT_SUSPEND_WITHDRAWN`. 해제는 `ACTIVE`로 되돌리고 `suspended_at`을 비운다. 정지가 아니면 `409` `ACCOUNT_NOT_SUSPENDED`. Bearer가 있는 호출이다. 관리자 전용 로그인은 아직 없다.

---

## 13. 로컬 테스트 전용 (`local` 프로필)

> Spring `@Profile("local")` — **prod 프로필에서는 컨트롤러 미등록(404)**.  
> FE는 development에서만 버튼/호출. BFF 경유 시에도 Spring이 local이어야 함.

| 기능 | Method | Spring | 비고 |
|------|--------|--------|------|
| 비밀번호 인코딩 | POST | `/api/v1/test/password/encode` | 인증 불필요 |
| **내 스토리 읽음 초기화** | DELETE | `/api/v1/test/story-views` | Bearer 필수. `ultary_story_view`에서 내 viewer 행 전부 삭제 → `deletedCount` |
| **닉네임 변경 기간 초기화** | POST | `/api/v1/test/nickname-cooldown` | Bearer 필수. 내 `nickname_changed_at`을 올해 1월 1일 00:00으로 바꿔 7일 쿨다운을 푼다 |
| **펫 멘션 ID 변경 기간 초기화** | POST | `/api/v1/test/pets/{petId}/mention-id-cooldown` | Bearer 필수. 내 펫의 `mention_id_changed_at`을 올해 1월 1일 00:00으로 바꿔 30일 쿨다운을 푼다. 없거나 내 펫이 아니면 404 |
| **액세스·리프레시 토큰 초기화** | DELETE | `/api/v1/test/tokens` | Bearer 필수. 내 `ultary_token` 리프레시 행을 모두 폐기 → `userNo`, `revokedCount`. 액세스 JWT는 DB에 없으므로, 버튼은 성공 후 access·refresh 쿠키(와 개발용 만료 쿠키)를 지워야 로그인 전 상태가 된다 |

HTTP: `requests/test.http`

---

## 참고

- 코드 상수: `src/lib/api/endpoints.ts` (`bffEndpoints` / `springEndpoints`)
- BFF 스켈레톤: `src/app/api/**/route.ts`
- REST Client 틀: `http/bff.http` (프론트) · Spring: `requests/*.http`
- DB 스키마: `share/database/schema/mariadb_10_1/001_init_schema.sql` (**schema_version 20**)
  - 기존 DB v7→v8: `002_file_source_attribution.sql`
  - 기존 DB v8→v9: `003_comment_reply_like.sql`
  - 기존 DB v9→v10: `004_search_history_user_only.sql` (최근 검색 = 들어간 유저 울타리만)
  - 기존 DB v10→v11: `005_pet_priority_profile.sql` (펫 priority, 유저 profile_file_id 제거)
  - 기존 DB v11→v12: `006_story_overlay.sql` (스토리 글자·펫 멘션)
  - 기존 DB v12→v13: `007_recent_pet_tag.sql` (사진·스토리 최근 펫 태그. 검색 최근 울타리와 별도)
  - 기존 DB v13→v14: `008_notification.sql` (알림 집계, 스토리 공감)
  - 기존 DB v14→v15: `009_drop_withdrawal_requested_at.sql` (`withdrawal_requested_at` 제거)
  - 기존 DB v15→v16: `010_notification_setting.sql` (알림 종류별 스위치. 행이 없으면 전부 켜짐)
  - 기존 DB v16→v17: `011_user_privacy.sql` (공개 범위. 행이 없으면 화면 기본값)
  - 기존 DB v17→v18: `012_dm.sql` (1:1 메시지. 게시글 사진·스토리 사진 공유)
  - 기존 DB v18→v19: `013_feed_pin_and_save.sql` (`ultary_feed_store`→`ultary_feed_pin`, `store_count`→`pin_count`, 나만 보는 `ultary_feed_save`)
  - 기존 DB v19→v20: `014_user_suspended.sql` (`withdrawal_status`에 `SUSPENDED`, `suspended_at`)
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
| 1-14 | DM | 1:1 방, 글·게시글 사진·스토리 사진. HTTP `dm.http` |
| 1-15 | 웹소켓 | 입장 토큰 후 Spring에 직접 연결. 알림 배지·DM 푸시. HTTP `ws.http` |
| 1-16 | DM 읽음·입력 중 | `DM_READ`, `peerLastReadMessageId`, 보는 중, `DM_TYPING` |
| 다음 | — | |

파일 업로드 상대경로: `images/{uuid}.ext`, `videos/{uuid}.ext` (`UPLOAD_DIR`).  
시드 CDN·임베드 요약은 위 **FileSummary** 절 참고.
