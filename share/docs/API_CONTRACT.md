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

관리자 회원 관리·처리 이력: `GET /api/v1/admin/users`, `GET /api/v1/admin/users/{userNo}`, `GET /api/v1/admin/actions`. 정지/해제는 기존 POST 경로를 유지하고 사유를 저장한다. 목록은 `page`(0부터)·`size`, `{items,totalCount,page,pageSize}`를 사용한다. 상세 권한·마스킹·기록 범위는 [회원 관리 문서](admin-management.md)를 참고한다.

관리자 AI 오류 로그: `GET /api/v1/admin/ai/logs`, `GET /api/v1/admin/ai/logs/{aiRequestId}`. BFF는 `/api/admin/ai/logs` 및 하위 ID 경로. 관리자 인증·필터·페이지 규약은 [비동기 모더레이션 문서](async-moderation.md#관리자-ai-로그-조회) 참조.

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
| `GET /main/search/recent` | `items`(5), `nextCursorHistoryId` | 울타리·태그 혼합. `type=USER|TAG`. USER는 `profileFile`·`petTags`, TAG는 `tagId`·`hashtag`  `totalCount`: 표시 가능한 전체 개수. 첫 5개, more는 20개씩. nextCursorHistoryId가 없으면 끝. |
| `GET /main/search/recent/more` | `items`(20), `nextCursorHistoryId` | `cursorHistoryId` = 직전 `nextCursorHistoryId`. 없으면 끝  `totalCount`: 표시 가능한 전체 개수. 첫 5개, more는 20개씩. nextCursorHistoryId가 없으면 끝. |
| `POST /main/search/recent` | `{ targetUserNo }` 또는 `{ tagId }` | 울타리·태그 피드 진입 시. 둘 중 하나만. 같은 대상은 `searched_at`만 갱신. 태그 없으면 `TAG_NOT_FOUND` |
| `DELETE /main/search/recent` | data null | 최근 검색 모두 지우기. 탈퇴·차단·삭제 태그로 목록에 없던 행도 삭제 |
| `GET /main/search` | `users[]`, `pets[]` | 로그인한 본인 계정은 넣지 않는다. 내 `userNo`와, 보호자가 나인 펫을 뺀다. 검색 페이지·사진 태그·스토리 `@` 공통 |
| `GET /main/search?type=PET` | `pets[].ownerNickname` | 보호자 닉네임. `userNo`는 보호자. 멘션명만 검색돼도 닉네임을 함께 준다 |
| `GET /main/pet-tags/recent` | `items`(최대 20) | 스토리 `@`·사진 태그의 최근 펫. `usedAt` 내림차순. 검색 최근 울타리와 다른 저장소 |
| `POST /main/pet-tags/recent` | `{ petId }` | 멘션을 고를 때 저장. 같은 펫은 `used_at`만 갱신. `POST /main/search/recent`와 무관 |
| `DELETE /main/pet-tags/recent` | data null | 내 최근 펫 태그 전부 삭제 |
| `GET /feeds/{id}/comments` · `.../replies` | `authorProfileFile` | 작성자의 대표 펫 사진 `FileSummary`. 없으면 `null`. 인라인 `replies`에도 동일 |
| `POST /feeds` | 게시글 단건 | content 최대 100자. AI 검사 통과 후 저장. 400 AI_CONTENT_BLOCKED 또는 503 AI_CHECK_UNAVAILABLE이면 미저장·독립 검사 로그 보관. 상세 ai-manual-review-and-phone-demo.md |
| `PATCH /feeds/{feedId}` | 게시글 단건 | 작성자 전용. content/clearContent/visibility 및 mediaTags(기존 사진 ID별 mentions 교체), tagIds(본문 해시태그 연결 교체). 원본 미디어 교체 없음. 상세는 [feed-edit.md](feed-edit.md) |
| `PATCH /feeds/{feedId}` | 게시글 단건 | content 최대 100자. 작성과 같이 저장 전 동기 검사. 실패하면 원본 유지 |
| 댓글·답글 작성/수정 | — | content 최대 100자. 즉시 저장·공개하고 DB 작업자가 비동기 검사. 유해 시 숨김/마지막 승인 본문 복구 후 AI_MODERATION 알림. AI 장애는 FAILED 로그·재시도이며 콘텐츠 유지 |
| `GET /tags/recommend` | `TagResponse[]` | 게시글 내용(q) 기반 해시태그 최대 5. 총 3회 시도 후 실패 시 503 서비스 오류 안내. 정상 빈 결과만 DB 추천으로 보완 |
| `GET /pets` | `priority` | 작을수록 우선. 목록은 이 순서, 같으면 petId. 유저 프로필 사진은 그중 사진 있는 첫 펫. **로그인한 나의 펫만** |
| `PATCH /pets/{petId}` | `profileFileId` | 다른 파일로 바꾸거나 `removeProfileFile=true`면 이전 `ultary_file`을 삭제 표시(`is_deleted`, `deleted_at`). 다른 곳에서 쓰는 파일은 유지 |
| `GET /users/{userNo}/pets` | 항목은 `GET /pets`와 동일 | 그 유저의 활성 펫. 정렬도 같다. 나의 `userNo`면 `GET /pets`와 같은 결과 |
| `GET /my-ultary/feeds` | 그리드 항목 | **로그인한 나의** 게시글. `coverFile`, `coverThumbnailFile` |
| `GET /users/{userNo}/feeds` | 항목은 `GET /my-ultary/feeds`와 동일 | 그 유저의 게시글 그리드. 비공개이고 조회자가 팔로우하지 않으면 빈 배열. 비공개 계정의 `PUBLIC`은 조회자가 팔로우할 때만. `NEIGHBORS`는 어느 방향이든 ACCEPTED 또는 본인, `PRIVATE`는 본인만 |
| `GET /users/{userNo}/pinned-feeds` | 항목은 게시글 그리드와 동일 | 그 유저가 울타리에 고정한 글. 비공개이고 조회자가 팔로우하지 않으면 빈 배열. 나의 `userNo`면 `GET /my-ultary/pinned-feeds`와 같다 |
| `GET /my-ultary/saved-feeds` | 항목은 게시글 그리드와 동일 | 나만 보는 저장. 다른 사람 울타리 API는 없다 |
| `POST /feeds/{feedId}/pin` · `DELETE` | 게시글 단건 | 울타리 고정. 응답 `pinCount`, `pinnedByMe` |
| `POST /feeds/{feedId}/save` · `DELETE` | 게시글 단건 | 나만 보는 저장. 응답 `savedByMe`. 개수는 공개하지 않음 |
| `GET /users/{userNo}/tagged-feeds` | 항목은 게시글 그리드와 동일 | 그 유저 펫이 태그된 글. 비공개이고 조회자가 팔로우하지 않으면 빈 배열. 나의 `userNo`면 `GET /my-ultary/tagged-feeds`와 같다 |
| `GET /my-ultary` · `GET /users/{userNo}/ultary` | `hasStory`, `hasUnviewed`, `privateAccount` | 울타리 스토리 버튼. 비공개 계정은 조회자가 팔로우할 때만 `hasStory`. `privateAccount`는 `GET /users/{userNo}/ultary`에만. 프로필만 주고 펫·게시글 목록은 포함하지 않는다 |
| `GET /main/stories?userNo=` · `GET /my-ultary/stories` | 각 항목 `viewedByMe`, `likedByMe`, `texts`, `mentions` | **스토리 단건** 읽음 (`ultary_story_view`). 본인 스토리도 동일. `likedByMe`는 조회자의 공감(취소 제외). 글자·펫 멘션은 등록 때 넣은 위치 그대로 |
| `POST /my-ultary/stories` | `texts`, `mentions` | 사진 위 글자(크기 12/16/20/24 기본 16, 굵게·밑줄·취소선, `#RRGGBB`, 위치 %)와 `@펫`(`petId`, 위치 %). 각 최대 20. 후보 검색 `GET /main/search?type=PET` |
| `POST /stories/{storyId}/view` | 스토리 단건 (`viewedByMe`, `likedByMe`) | 해당 `storyId`만 INSERT IGNORE. **본인 스토리도 기록** |
| `POST /stories/{storyId}/like` · `DELETE` | `likeCount`, `likedByMe` | 스토리 공감. 본인 또는 ACCEPTED 팔로우 관계만. 취소는 소프트 삭제 |
| `GET /users/blocks` | 배열 | 내가 차단한 사용자. `nickname`, `profileFile`(대표 펫 사진, 없으면 null), `blockedAt`. 해제는 `DELETE /users/{userNo}/block` |
| `GET /auth/me` | `name`, `googleLinked`, `kakaoLinked` 등 | 내 회원정보. `name`이 null이면 회원정보 수정에서 최초 등록 가능 |
| `PATCH /auth/me` | `MeResponse` | 닉네임 제외. `name`은 비어 있을 때만 최초 등록(최대 20자). 이미 있으면 `NAME_ALREADY_SET` |
| `GET /auth/social/google` · `/kakao` | 리다이렉트 | BFF OAuth 시작. `intent=link&returnUrl=/settings/mypage`면 로그인 유지 연동. 생략·`login`이면 소셜 로그인 |
| `GET /auth/social/google/callback` · `/kakao/callback` | 리다이렉트 | `intent=link` → Spring `POST /social/link` 후 `?linked=`. 아니면 `POST /social/login` |
| `POST /auth/social/link` | `MeResponse` | Bearer. Body는 소셜 로그인과 같음. `SOCIAL_ALREADY_LINKED`·`SOCIAL_ACCOUNT_IN_USE` |
| `DELETE /auth/social/unlink?provider=` | `MeResponse` | Bearer. `SOCIAL_NOT_LINKED`. 비밀번호 없고 소셜 하나면 `CANNOT_UNLINK_LAST_LOGIN` |
| `GET /notifications/unread-count` | `unreadCount` | 하단 배지. 읽음 처리 없음. `/auth/me`에 없음. 소켓이 같은 숫자를 `NOTIFICATION_UNREAD`로 밀어 줌 |
| `POST /ws/ticket` | `ticket`, `expiresIn` | 웹소켓 입장 토큰. 30초, 한 번. Bearer. 소켓은 `ws://{Spring}/api/v1/ws` 로 브라우저가 직접 연결 |
| 웹소켓 `/api/v1/ws` | 텍스트 JSON | 첫 메시지 `{type:AUTH,ticket}`. 성공 `AUTH_OK` 후 `NOTIFICATION_UNREAD`. 새 DM은 `DM_MESSAGE`(받는 사람 기준 `fromMe`). 읽음은 상대에게 `DM_READ`. 입력 중은 상대에게 `DM_TYPING`. 25초마다 `PING` |
| `GET /notifications` | `unreadCount`, `items` | 알림 페이지. 목록을 준 뒤 그때까지 안 읽은 알림을 읽음 처리. `message`는 서버 문장. 팔로우는 «팔로우를 요청했습니다» 또는 «팔로우했습니다». `following`이 false면 팔로우, true면 취소. `PENDING` 팔로우는 `POST /neighbors/{neighborId}/accept`, 이미 팔로우된 맞팔은 `POST /users/{actorUserNo}/neighbors/request`, 취소는 `DELETE /neighbors/{neighborId}` |
| `GET /settings/activities` | `items` | 내 활동. 내가 한 좋아요·댓글·답글·팔로우·게시글·스토리. `neighborStatus`가 `PENDING` 또는 `ACCEPTED`면 취소 `DELETE /neighbors/{neighborId}` |
| `GET /settings/notifications` · `PATCH` | 스위치 10개 | 알림 종류별 켜기. 없으면 전부 켜짐. PATCH는 넣은 필드만. 끈 종류는 알림 목록에서 빠짐 |
| `GET /settings/privacy` · `PATCH` | 공개 범위 7개 | 비공개 계정, 게시글·스토리 범위, 팔로우 신청·댓글·멘션·태그. 행이 없으면 기본값. PATCH는 넣은 필드만 |
| `GET /users/{userNo}/neighbors?type=` | 배열 | 팔로우·팔로워 목록. `FOLLOW` 팔로우(기본), `FOLLOWER` 팔로워. 응답 `listType`도 같다. 카운트는 `followCount`, `followerCount`. 항목의 `hasStory`, `hasUnviewed`는 조회자 기준 스토리 유무·미열람 상태. 채팅 상대도 이 목록 |
| `POST /dm/rooms/start` | `room`, `message` | targetUserNo 및 메시지/공유 데이터. 방 생성과 첫 전송을 같은 트랜잭션으로 처리. [상세](dm-first-message.md) |
| `GET /dm/share-targets` | `items` | 공유 대상. `mode` SHARE/DM/STORY_TAG/FEED_TAG, `q` 닉네임·펫태그 검색(제한 전), `priorityOrder` 앞 3순위 순열. 1~9순위·상세는 [공유 대상](share-targets.md). `userNo`, `nickname`, `petTags`(@ 없음), `pets`(petId·mentionId), `profileFile`, `dmRoomId`, `following`, `followedBy`, `group`, `activeAt` |
| `GET /tags/{tagId}` | 태그 | `purpose`는 `USER` 또는 `COMMERCIAL`. `title`·`content`·`link`·`images`는 `profileStatus=APPROVED`일 때만. 요청자만 `profileRequest` |
| `POST /tags/{tagId}/profile-requests` | 요청 1개 | 상업 태그에 넣을 설명. 관리자 승인 후에만 태그 조회에 나온다 |
| `GET /tags/profile-requests` | 배열 | 내가 넣은 태그 설명 요청. `status`를 비우면 전부 |
| `GET /admin/menu-counts` | `pendingTagRequestCount`, `requestedReportCount`, `failedAiRequestCount` | 메뉴 뱃지. 태그 설명 요청 `PENDING`, 대상 회원/작성자가 정지되지 않은 신고 `REQUESTED`·`CONFIRMED` 합, AI 호출 로그 `FAILED` 건수. 정지 회원의 태그 요청은 세지 않는다. AI는 같은 작업의 실패를 1건으로 세며 관리자 처리 완료 작업은 제외한다. 목록은 없다. 없으면 0 |
| `GET /admin/tags/profile-requests` | `items`, `nextCursorRequestId`, `totalCount` | 상업 태그 설명 요청. `status`를 비우면 전부, 최신순. `totalCount`는 그 `status`의 전체 건수. 커서와 `limit`는 세지 않는다. 정지 회원의 요청은 목록과 건수에서 뺀다. 다음은 `cursorRequestId` |
| `GET /admin/reports` | `items`, `nextCursorReportId`, `totalCount` | 신고 목록. `status`를 비우면 전부, 신고요청·확인이 먼저(대상이 정지인 건 제외), 그다음 나머지. 같은 묶음은 최신순. `totalCount`는 그 `status`의 전체 건수. 커서와 `limit`는 세지 않는다. `reporterUserNo`·`reporterNickname`은 신고 회원. `targetUserNo`·`targetNickname`은 대상 회원(회원 신고는 그 회원, 글·댓글·답글은 작성자). 글·댓글·답글은 `targetContent`(30자, 넘으면 `...`). `targetSuspended`는 그 회원이 정지인지. 다음은 `cursorReportId` |
| `GET /admin/reports/{reportId}` | 신고 1개 | 목록 항목과 같다. `targetUserNo`·`targetNickname`·`targetSuspended` 포함. 없으면 404 |
| `POST /admin/reports/{reportId}/confirm` · `reject` · `delete-content` · `suspend` | 신고 1개 | 어떤 상태에서든 다시 조치. 정지→다른 상태면 회원 정지 해제, 삭제조치→다른 상태면 글·댓글·답글 복구. 같은 대상에 같은 상태 신고가 더 있으면 유지. `delete-content`는 글·댓글·답글, `suspend`는 회원만 |
| `POST /admin/tags/{tagId}/approve` · `reject` · `pending` | 요청 1개 | 최신 요청을 승인·거절·대기로 바꾼다. 승인·거절된 요청도 다시 바꿀 수 있다. 승인하면 그 설명이 태그에 공개된다. 거절 Body `rejectMessage`는 신청자 목록의 `rejectMessage`로 남는다. `pending`은 본문 없음 |
| `GET /dm/rooms` | `items` | 내 대화방. `peerUserNo`, `peerNickname`, `profileFile`, `lastMessage`, `lastMessageAt`, `unreadCount`, `following`, `followedBy` |
| `POST /dm/rooms` | 방 1개 | `{ targetUserNo }`. 팔로우 또는 팔로워만. 있으면 그 방을 다시 연다. 응답에 `following`, `followedBy` |
| `GET /dm/rooms/{roomId}/messages` | `items`, `nextCursorMessageId`, `peerLastReadMessageId`, `following`, `followedBy` | 오래된 순. 조회하면 읽음. `following`·`followedBy`는 그 방 상대와 나. 둘 다 false면 팔로우 관계가 아님 |
| `POST /dm/rooms/{roomId}/viewing` | 없음 | `{ viewing }`. true는 약 10초마다. 20초 없으면 방을 나간 것. 둘 다 보고 있으면 새 메시지는 바로 읽음 |
| `POST /dm/rooms/{roomId}/typing` | 없음 | `{ typing }`. 상대에게 `DM_TYPING`. 4초 안에 true가 없으면 멈춤 |
| `POST /dm/rooms/{roomId}/messages` | 메시지 1개 | `{ body, feedId, feedMediaId }` 게시글 사진 공유. `{ body, storyId }` 스토리 공유. 둘 다 실제 작성자 `authorUserNo`·`authorNickname`·`authorProfileFile` 및 조회자 기준 `authorHasStory`·`authorHasUnviewed` 포함. 글만 보내도 된다 |
| `PATCH /notifications/{notificationId}/read` | 그 항목 | 내 알림만 읽음 |
| `POST /notifications/read-all` | data null | 내 알림 전부 읽음 |

**재생 순서 (FE)**  
1. 응답 배열은 `created_at` ASC (서버 정렬 유지).  
2. 시작 인덱스 = 첫 `viewedByMe === false`. 전부 `true`이면 `0`(처음부터).  
3. 슬라이드할 때마다 `POST .../view`로 그 스토리 읽음 처리.

## 페이지·게스트 접근

FE 라우트 가드·공유 게시글 게스트 열람·로그인 모달: [`auth-access.md`](./auth-access.md).  
Spring API(게스트 단건 GET·쓰기 401): [`spring-auth-api.md`](./spring-auth-api.md).

## 팔로우·팔로워 맞팔 구분

`GET /users/{userNo}/neighbors?type=FOLLOW|FOLLOWER`의 각 항목에 `mutual`을 포함한다. 목록 주인(`userNo`)과 해당 사용자가 서로 팔로우하면 true이며, 로그인 조회자 기준인 `following`과 구분한다. 맞팔을 먼저 조회하고 각 그룹 안에서는 기존 최신순을 유지한다. FE는 맞팔을 상단의 «서로 팔로우 하는 목록»에 표시하며 나머지 목록과 구분한다.

## 작성 데이터와 설정

작성 단계 데이터는 브라우저 메모리에만 보관하며 별도 사진 임시저장·편집본 저장·사진 태그 저장 API를 제공하지 않는다. 최종 게시/수정은 `/feeds`와 `/feeds/{feedId}`를 사용한다. 데이터 없는 작성 단계 접근은 메인으로 이동한다. 설정은 개별 조회·변경 API만 제공한다. 미사용 501 API 5개와 관련 스켈레톤/엔드포인트를 제거했다.

## 비동기 콘텐츠 모더레이션 (v32)

[async-moderation.md](./async-moderation.md) 참조. 새 FE 검사 API는 없으며, 작성/수정 응답 형태는 유지한다. 소켓 CONTENT_MODERATED는 본문을 포함하지 않는 무효화 이벤트다. 결과 모달은 표시하지 않으며 알림 목록은 type=AI_MODERATION, message=서비스 안내문과 대상 이동용 feedId/feedCommentId/feedReplyId를 반환한다.


## 공개 SEO 목록

GET /api/v1/public/seo/sitemap: BFF 키 필수, 사용자 JWT 불필요. type=PROFILE|FEED, cursorId>=0, limit=1~1000(기본 200). 응답 items([{id,nickname?}]), nextCursorId. 활성 공개 계정과 그 계정의 삭제되지 않은 PUBLIC 피드만 반환하며 개인 연락처/본문은 포함하지 않는다. no-store. 상세는 [seo.md](./seo.md).
