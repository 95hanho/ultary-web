# Ultary API Contract

## Source of truth

공통 스펙의 최신본은 **`share/`** 이다.

| 경로 | 내용 |
|------|------|
| `share/docs/api-memo.md` | 엔드포인트·도메인 메모 |
| `share/docs/auth-access.md` | 페이지·공유 피드 인증 접근 |
| `share/docs/spring-auth-api.md` | Spring 인증·게스트 API 변경 |
| `share/validation/` | 입력 검사 (`rules.json`) |
| `share/database/` | MariaDB 스키마·로컬 시드 |

- **ultary-web (FE/BFF)** · **ultary-api (Spring)** 모두 이 폴더를 미러링한다.
- Controller / `springEndpoints` / BFF Route는 `api-memo.md`와 동일해야 한다.
- 경로·규칙을 바꿀 때는 **먼저 `share/` 수정 → 각 레포 반영**.

구 경로 `docs/api-memo.md`, 루트 `database/` 는 삭제됨. 본문은 `share/`만 사용.

## 응답

- 성공: `ApiResponse<T>` (`success: true`, `code: "OK"`, `message`, `data`)
- 실패 (비즈니스·Bean Validation): `ApiResponse` (`success: false`, `code`, `message`, `data`)
  - 입력 검증: `code=INVALID_INPUT`, `message`=첫 필드 오류 문구, `data`=필드별 메시지 맵
- 인증 필터 등 일부: RFC 7807 `ProblemDetail` + `code` / `message` extension

### FileSummary (임베드)

피드·스토리·프로필·검색·태그 등 **읽기 응답**에 `fileId`만 주지 않고 아래 요약을 같이 넣는다.
(`FileSummaryResponse` / 필드명 `file`, `profileFile`, `coverFile`, `images` …)

| 필드 | 설명 |
|------|------|
| `fileId` | `ultary_file.file_id` |
| `filePath` | 상대(`images/…`) 또는 CDN 절대 URL |
| `mimeType` / `extension` | 표시·타입 판별 |
| `sourceType` | OWNED \| UNSPLASH \| AI \| ETC |
| `authorName` / `sourceUrl` / `licenseUrl` / `copyrightNotice` | 출처 표기(없으면 null) |

쓰기 요청(업로드·피드/스토리 등록)은 기존처럼 **fileId만** 보낸다.

### Story · 읽음 (FE)

| API | 필드 | 의미 |
|-----|------|------|
| `GET /main/stories/owners` | `hasUnviewed` | 그 유저 활성 스토리 중 **하나라도** 미열람 |
| `GET /main/stories/owners` | `profileFile` | 소유자의 대표 펫 사진 `FileSummary`. 없으면 `null`. 스토리 미디어는 포함하지 않음 |
| `GET /main/feeds` · `GET /feeds/{feedId}` | `authorProfileFile` | 작성자의 대표 펫 사진 `FileSummary`. 없으면 `null`. 게시글 `media[].file`과 별개 |
| `GET /main/feeds/recommended` · `GET /main/search/recommended` | 피드 배열 | 나중에 추천 알고리즘 추가해야함. 지금은 조회 가능한 전체 피드를 최신순 `limit`건. 항목은 피드 단건과 동일 |
| `GET /main/search/recent` | `items`(5), `nextCursorHistoryId` | 검색창을 열 때. 들어간 유저 울타리. `profileFile`은 대표 펫 사진, 없으면 null |
| `GET /main/search/recent/more` | `items`(20), `nextCursorHistoryId` | `cursorHistoryId` = 직전 `nextCursorHistoryId`. 없으면 끝 |
| `POST /main/search/recent` | `{ targetUserNo }` | 검색 후 그 울타리에 들어갈 때 저장. 같은 쌍은 `searched_at`만 갱신 |
| `DELETE /main/search/recent` | data null | 최근 검색 모두 지우기. 탈퇴·차단으로 목록에 없던 행도 삭제 |
| `GET /main/search` | `users[]`, `pets[]` | 로그인한 본인 계정은 넣지 않는다. 내 `userNo`와, 보호자가 나인 펫을 뺀다. 검색 페이지·사진 태그·스토리 `@` 공통 |
| `GET /main/search?type=PET` | `pets[].ownerNickname` | 보호자 닉네임. `userNo`는 보호자. 멘션명만 검색돼도 닉네임을 함께 준다 |
| `GET /main/pet-tags/recent` | `items`(최대 20) | 스토리 `@`·사진 태그의 최근 펫. `usedAt` 내림차순. 검색 최근 울타리와 다른 저장소 |
| `POST /main/pet-tags/recent` | `{ petId }` | 멘션을 고를 때 저장. 같은 펫은 `used_at`만 갱신. `POST /main/search/recent`와 무관 |
| `DELETE /main/pet-tags/recent` | data null | 내 최근 펫 태그 전부 삭제 |
| `GET /feeds/{id}/comments` · `.../replies` | `authorProfileFile` | 작성자의 대표 펫 사진 `FileSummary`. 없으면 `null`. 인라인 `replies`에도 동일 |
| `GET /pets` | `priority` | 작을수록 우선. 목록은 이 순서, 같으면 petId. 유저 프로필 사진은 그중 사진 있는 첫 펫. **로그인한 나의 펫만** |
| `PATCH /pets/{petId}` | `profileFileId` | 다른 파일로 바꾸거나 `removeProfileFile=true`면 이전 `ultary_file`을 삭제 표시(`is_deleted`, `deleted_at`). 다른 곳에서 쓰는 파일은 유지 |
| `GET /users/{userNo}/pets` | 항목은 `GET /pets`와 동일 | 그 유저의 활성 펫. 정렬도 같다. 나의 `userNo`면 `GET /pets`와 같은 결과 |
| `GET /my-ultary/feeds` | 그리드 항목 | **로그인한 나의** 게시글. `coverFile`, `coverThumbnailFile` |
| `GET /users/{userNo}/feeds` | 항목은 `GET /my-ultary/feeds`와 동일 | 그 유저의 게시글 그리드. 쿼리 `limit` 또는 `size`. `PUBLIC` 조회 가능, `NEIGHBORS`는 ACCEPTED 이웃 또는 본인, `PRIVATE`는 본인만. 나의 `userNo`면 `GET /my-ultary/feeds`와 같은 결과 |
| `GET /users/{userNo}/pinned-feeds` | 항목은 게시글 그리드와 동일 | 그 유저가 울타리에 고정한 글. 다른 사람이 보면 작성자 기준으로 보이는 글만. 나의 `userNo`면 `GET /my-ultary/pinned-feeds`와 같다 |
| `GET /my-ultary/saved-feeds` | 항목은 게시글 그리드와 동일 | 나만 보는 저장. 다른 사람 울타리 API는 없다 |
| `POST /feeds/{feedId}/pin` · `DELETE` | 게시글 단건 | 울타리 고정. 응답 `pinCount`, `pinnedByMe` |
| `POST /feeds/{feedId}/save` · `DELETE` | 게시글 단건 | 나만 보는 저장. 응답 `savedByMe`. 개수는 공개하지 않음 |
| `GET /users/{userNo}/tagged-feeds` | 항목은 게시글 그리드와 동일 | 그 유저 펫이 태그된 글. 그 유저가 쓴 글은 제외. 보이는 글만. 나의 `userNo`면 `GET /my-ultary/tagged-feeds`와 같다 |
| `GET /my-ultary` · `GET /users/{userNo}/ultary` | `hasStory`, `hasUnviewed` | 울타리 스토리 버튼. 없음 / 안읽음 / 다 읽음. 기준은 조회한 나. 본인 스토리 열람도 읽음에 포함. 프로필만 주고 펫·게시글 목록은 포함하지 않는다 |
| `GET /main/stories?userNo=` · `GET /my-ultary/stories` | 각 항목 `viewedByMe`, `likedByMe`, `texts`, `mentions` | **스토리 단건** 읽음 (`ultary_story_view`). 본인 스토리도 동일. `likedByMe`는 조회자의 공감(취소 제외). 글자·펫 멘션은 등록 때 넣은 위치 그대로 |
| `POST /my-ultary/stories` | `texts`, `mentions` | 사진 위 글자(크기 12/16/20/24 기본 16, 굵게·밑줄·취소선, `#RRGGBB`, 위치 %)와 `@펫`(`petId`, 위치 %). 각 최대 20. 후보 검색 `GET /main/search?type=PET` |
| `POST /stories/{storyId}/view` | 스토리 단건 (`viewedByMe`, `likedByMe`) | 해당 `storyId`만 INSERT IGNORE. **본인 스토리도 기록** |
| `POST /stories/{storyId}/like` · `DELETE` | `likeCount`, `likedByMe` | 스토리 공감. 본인 또는 ACCEPTED 이웃만. 취소는 소프트 삭제 |
| `GET /users/blocks` | 배열 | 내가 차단한 사용자. `nickname`, `profileFile`(대표 펫 사진, 없으면 null), `blockedAt`. 해제는 `DELETE /users/{userNo}/block` |
| `GET /notifications/unread-count` | `unreadCount` | 하단 배지. 읽음 처리 없음. `/auth/me`에 없음. 소켓이 같은 숫자를 `NOTIFICATION_UNREAD`로 밀어 줌 |
| `POST /ws/ticket` | `ticket`, `expiresIn` | 웹소켓 입장 토큰. 30초, 한 번. Bearer. 소켓은 `ws://{Spring}/api/v1/ws` 로 브라우저가 직접 연결 |
| 웹소켓 `/api/v1/ws` | 텍스트 JSON | 첫 메시지 `{type:AUTH,ticket}`. 성공 `AUTH_OK` 후 `NOTIFICATION_UNREAD`. 새 DM은 `DM_MESSAGE`(받는 사람 기준 `fromMe`). 읽음은 상대에게 `DM_READ`. 입력 중은 상대에게 `DM_TYPING`. 25초마다 `PING` |
| `GET /notifications` | `unreadCount`, `items` | 알림 페이지. 목록을 준 뒤 그때까지 안 읽은 알림을 읽음 처리. `message`는 서버 문장. `snippet`은 텍스트 일부. 이동은 `feedId`·`feedCommentId`·`feedReplyId`·`storyId`·`neighborId`. 수락 버튼은 `neighborStatus=PENDING` |
| `GET /settings/activities` | `items` | 내 활동. 내가 한 좋아요·댓글·답글·이웃 신청·게시글·스토리. `type`, `occurredAt`, `targetNickname`, `profileFile`, `snippet`. 취소 버튼은 내가 보낸 신청이 `neighborStatus=PENDING`일 때 |
| `GET /settings/notifications` · `PATCH` | 스위치 10개 | 알림 종류별 켜기. 없으면 전부 켜짐. PATCH는 넣은 필드만. 끈 종류는 알림 목록에서 빠짐 |
| `GET /settings/privacy` · `PATCH` | 공개 범위 7개 | 비공개 계정, 게시글·스토리 범위, 이웃 신청·댓글·멘션·태그. 행이 없으면 기본값. PATCH는 넣은 필드만 |
| `GET /users/{userNo}/neighbors?type=` | 배열 | 울타리 주민·이웃 목록. `RESIDENTS` 주민, `NEIGHBORS` 이웃. 채팅 상대도 이 목록. `userNo`, `nickname`, `profileFile` |
| `GET /dm/rooms` | `items` | 내 대화방. `peerUserNo`, `peerNickname`, `profileFile`, `lastMessage`, `lastMessageAt`, `unreadCount` |
| `POST /dm/rooms` | 방 1개 | `{ targetUserNo }`. 주민 또는 이웃만. 있으면 그 방을 다시 연다 |
| `GET /dm/rooms/{roomId}/messages` | `items`, `nextCursorMessageId`, `peerLastReadMessageId` | 오래된 순. 조회하면 읽음. `peerLastReadMessageId`는 상대가 읽은 마지막 메시지, 없으면 null. `fromMe`, `body`, `createdAt`, `share` |
| `POST /dm/rooms/{roomId}/viewing` | 없음 | `{ viewing }`. true는 약 10초마다. 20초 없으면 방을 나간 것. 둘 다 보고 있으면 새 메시지는 바로 읽음 |
| `POST /dm/rooms/{roomId}/typing` | 없음 | `{ typing }`. 상대에게 `DM_TYPING`. 4초 안에 true가 없으면 멈춤 |
| `POST /dm/rooms/{roomId}/messages` | 메시지 1개 | `{ body, feedId, feedMediaId }` 게시글 사진 공유. `{ body, storyId }` 스토리 사진만. 글만 보내도 된다 |
| `PATCH /notifications/{notificationId}/read` | 그 항목 | 내 알림만 읽음 |
| `POST /notifications/read-all` | data null | 내 알림 전부 읽음 |

**재생 순서 (FE)**  
1. 응답 배열은 `created_at` ASC (서버 정렬 유지).  
2. 시작 인덱스 = 첫 `viewedByMe === false`. 전부 `true`이면 `0`(처음부터).  
3. 슬라이드할 때마다 `POST .../view`로 그 스토리 읽음 처리.

## 페이지·게스트 접근

FE 라우트 가드·공유 게시글 게스트 열람·로그인 모달: [`auth-access.md`](./auth-access.md).  
Spring API(게스트 단건 GET·쓰기 401): [`spring-auth-api.md`](./spring-auth-api.md).

## 스켈레톤

아직 로직·DB가 없는 API는 `ErrorCode.NOT_IMPLEMENTED` (HTTP 501) 을 반환한다.
로그인/refresh/logout/me, health 등 이미 구현된 API는 예외.
