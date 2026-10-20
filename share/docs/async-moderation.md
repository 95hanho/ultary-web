# 콘텐츠 모더레이션: 동기 작성·비동기 후처리 (schema v32)

## 사용자 동작

- 게시글 작성 `POST /feeds`는 AI 검사 완료 후 저장한다. `FeedCreationService`가 콘텐츠 트랜잭션 밖에서 검사하고, 승인 시 `FeedService`의 저장 트랜잭션을 실행한다.
- 부적절 판정은 400 `AI_CONTENT_BLOCKED`와 분류별 한국어 사유를 반환한다. Gemini 장애는 503 `AI_CHECK_UNAVAILABLE`이며 유해 판정과 구분한다. 이때 게시글·게시글 알림·검사 작업은 생성하지 않고 초안은 유지한다.
- 검사 시도 로그는 독립 저장한다. 저장 전 검사이므로 `featureType=FEED_CAPTION,targetType=FEED,attemptNo=1`이며 작업/대상 ID·버전은 null일 수 있다. 성공한 신규 게시글은 승인 본문만 상태 테이블에 보존하고 중복 후처리 작업을 만들지 않는다.
- 게시글 수정과 댓글·답글 작성/수정은 AI를 기다리지 않고 저장·즉시 공개하며 아래 DB 작업자 후처리를 사용한다.
- 작성 화면은 업로드·AI 검사·저장을 기다리는 동안 전체 화면 dim과 중앙 회전 아이콘으로 조작·스크롤을 막는다. 실패 모달에는 서버 사유를 표시한다.
- 로딩 dim은 검정 30% 불투명도이며, 실제 게시 요청 중에만 표시한다. UI 확인용 상시 미리보기 코드는 제거했다. 빈 초안으로 직접 진입하면 기존처럼 울타리로 돌아간다.
- 최대 100자·인증·소유권·공개 범위 등 기존 검증은 저장 요청에서 계속 수행한다.
- 태그 추천 `GET /tags/recommend`는 동기 응답과 DB fallback을 유지한다.
- 콘텐츠 저장과 검사 상태/작업 등록은 하나의 DB 트랜잭션이다. 등록이 실패하면 저장도 롤백한다. 신규 게시글은 작업 대신 승인 상태만 기록한다.

## 영속 작업

- `ultary_ai_moderation_state`: 대상 종류(FEED/COMMENT/REPLY)·ID별 최신 버전, 마지막 승인 버전/본문.
- `ultary_ai_moderation_job`: 작성/수정 종류, 대상·작성자·피드, 본문 스냅샷, 버전, 시도 횟수, 다음 시도·lease·claim token.
- 기존 콘텐츠는 첫 수정 시 수정 전 본문을 기준으로 보존한다. 새 댓글·답글은 실제 승인 전까지 승인 이력이 없고, 신규 게시글은 동기 승인 본문을 기준으로 보존한다.
- 같은 대상의 미완료 작업은 버전 순서대로 처리한다. 서로 다른 대상은 최대 2개 병렬 처리한다.
- HTTP 호출 중에는 콘텐츠 DB 트랜잭션/행 잠금을 유지하지 않는다.
- 작업 상태는 PENDING / PROCESSING / APPROVED / REJECTED / SUPERSEDED / SKIPPED / FAILED.
- PENDING은 주기적으로 읽는다. PROCESSING 중 서버가 종료되면 120초 lease 만료 후 다른 작업자가 재점유한다.
- 결과 적용 시 claim token을 검사한다. 만료 후 재점유된 작업에 이전 작업자가 도착해도 결과를 반영하지 않는다.

## 판정과 장애

- safe=true: 승인 본문을 갱신한다. 예전 버전 승인은 최신 화면 내용을 덮어쓰지 않는다.
- safe=false: 최신 버전이며 현재 내용도 해당 스냅샷과 같은 경우에만 조치한다.
- 승인 본문이 있으면 그 본문으로 복구(RESTORED). 승인 이력이 없으면 소프트 삭제로 숨김(HIDDEN).
- 이미 삭제된 대상·부모의 작업은 SKIPPED. 최신 내용과 다른 유해 결과는 SUPERSEDED이며 조치/알림 없음.
- 유해 판정도 AI 호출 자체는 SUCCESS다. 오류/누락된 boolean safe를 유해 또는 정상으로 간주하지 않는다.
- timeout·네트워크·429·5xx·파싱 실패는 장애다. 콘텐츠를 유지하며 최대 3회 시도한다(1회 실패 후 5초, 2회 실패 후 20초).
- 키 미설정·재시도 불가 HTTP 오류는 FAILED다. 3회 실패도 FAILED로 남아 운영자가 확인할 수 있다. 사용자 경고/정지는 하지 않는다.
- 응답 헤더뿐 아니라 본문 수신까지 Gemini 전체 요청 deadline을 적용한다. API 키는 URL 대신 x-goog-api-key 헤더로 전달한다.

## 이력과 알림

- `ultary_ai_request_log`에 작업 ID·대상 종류/ID·버전·시도 번호·소요 시간·HTTP 상태·실패 코드/원인을 보존한다.
- 각 시도 로그는 REQUIRES_NEW 트랜잭션으로 저장한다. 콘텐츠/후속 조치 롤백으로 장애 기록이 사라지지 않는다.
- API 키와 제공자 응답 원문은 로그에 넣지 않는다. 작업 테이블의 최대 100자 본문 스냅샷은 검사·복구용이며 진단 로그와 구분한다.
- 조치·작업 완료·알림 저장은 같은 트랜잭션이다. 중복 완료 호출은 조치·개수·알림을 중복 반영하지 않는다.
- 영속 알림 `type=AI_MODERATION`. `message`는 서비스 안내문이며, 숨긴 글의 feed FK를 넣지 않아 글이 숨겨져도 안내가 남는다.
- 기존 알림 종류별 설정과 관계없이 이 서비스 안내를 표시한다. 로그인한 작성자에게만 MODERATION_RESULT 소켓 안내를 보낸다.
- CONTENT_MODERATED는 연결된 클라이언트에 `{ jobId, feedId, targetType, targetId, action }`만 보내는 무효화 이벤트다. 원문이나 판정 사유는 방송하지 않는다.
- 열린 피드/댓글 화면은 권한이 적용되는 기존 조회 API로 다시 읽는다. 숨긴 게시글 카드는 제거하고, 복구된 본문/댓글과 댓글 수를 갱신한다.
- 오프라인 중 놓친 안내는 알림 목록에서 확인한다. 별도 FE 검사 요청 API는 만들지 않는다.

## 적용 및 운영

### 관리자 AI 로그 조회

- 메뉴 건수 `GET /api/v1/admin/menu-counts`의 `failedAiRequestCount`는 FAILED 호출 로그 전체 건수다. 기본 실패 목록과 동일하며 필터·페이지와 무관하다. 재시도별 개별 기록을 세고, 상세 열람만으로 줄어들지 않는다. 관리자 홈과 사이드 메뉴에 `AI 오류 로그 (N)`으로 표시한다. 별도 읽음·처리 완료 상태나 DB 변경은 없다.

- 관리자 홈·사이드 메뉴의 **AI 오류 로그**: `/admin/ai/logs`, 상세 `/admin/ai/logs/{aiRequestId}`. 신고목록과 같은 관리자 레이아웃·목록/상세 스타일을 사용한다.
- 화면은 실패를 기본으로 조회하며 결과/기능/대상/오류 코드/대상 ID/회원/작업 필터, 화면 높이에 맞춘 목록 개수와 현재/전체 페이지·이전/다음 이동, 새로고침을 제공한다. 필터·화면 크기 변경 시 첫 페이지로 돌아간다. 상세는 호출 당시 오류와 현재 작업 상태·조치를 구분한다.

- 관리자 JWT 전용. 일반 회원 토큰 및 비로그인 요청은 401. 관리자 화면은 관리자 쿠키를 사용하는 BFF로 호출한다.
- Spring 목록: `GET /api/v1/admin/ai/logs`; BFF 목록: `GET /api/admin/ai/logs`.
- Spring 상세: `GET /api/v1/admin/ai/logs/{aiRequestId}`; BFF 상세: `GET /api/admin/ai/logs/{aiRequestId}`. 없는 ID는 404.
- 목록 기본값: `status=FAILED`, `limit=30`. `status=ALL`이면 전체, `SUCCESS`/`PENDING`도 선택 가능.
- 선택 필터: `featureType`(FEED_CAPTION/HASHTAG/PET_PROFILE/COMMENT_FILTER/ALT_TEXT), `targetType`(FEED/COMMENT/REPLY), `targetId`, `userNo`, `moderationJobId`, `errorCode`.
- ID 내림차순. `limit=1..100`, 다음 페이지는 `cursorAiRequestId=nextCursorAiRequestId`. 마지막 페이지 커서는 null. `totalCount`는 동일 필터의 전체 건수이며 커서·limit의 영향을 받지 않는다.
- `data={items: [...], nextCursorAiRequestId, totalCount}`. 상세는 `data`에 같은 단일 항목을 반환한다.
- 항목: `aiRequestId,userNo,featureType,targetFeedId,targetType,targetId,moderationJobId,contentVersion,attemptNo,modelName,status,errorCode,errorMessage,latencyMs,httpStatus,createdAt,jobStatus,resultAction,jobAttemptCount,nextAttemptAt`.
- `status`는 해당 호출 당시 결과다. `jobStatus/resultAction/jobAttemptCount/nextAttemptAt`는 조회 시점의 작업 상태로, 실패 후 재시도 성공·복구 여부를 구분할 수 있다. 태그 추천/이전 로그 등 작업이 없는 항목은 작업 필드가 null.
- 부적절 판정도 호출은 SUCCESS다. FAILED 목록은 인프라/AI 오류 목록이며 유해 콘텐츠 목록과 다르다.
- 프롬프트, 제공자 응답 본문, 콘텐츠 스냅샷, API 키는 조회 응답에 포함하지 않는다. 이전 로그는 새 진단 컬럼이 null일 수 있다.
- 잘못된 필터·ID·limit는 400 INVALID_INPUT. 별도 DB 변경은 없다. 요청 예시는 `requests/admin.http`.

### 사용자 안내 문구

- 숨김: `{게시글|댓글|답글}에 부적절한 표현이 확인되어 숨김 처리되었습니다.`
- 복구: `{게시글|댓글|답글} 수정 내용이 부적절한 표현으로 판정되어 이전 내용으로 복구되었습니다.`
- 조치 커밋 후 작성자의 연결된 세션에 `MODERATION_RESULT`를 보내며 FE는 `콘텐츠 확인 결과` 안내창을 표시한다. 같은 안내는 영속 알림에도 저장한다. AI 장애만으로는 이 안내를 보내지 않는다.

### 배포 및 재처리

- 1초마다 대기 작업을 읽는 `scheduling-1`의 `SqlSession ... synchronization is not active` / `JDBC Connection ... will not be managed by Spring` DEBUG는 트랜잭션 밖 단순 조회의 정상 세션 수명 로그다. 저장/점유/조치 트랜잭션 오류를 의미하지 않는다.
- `logging.level.[org.mybatis.spring.SqlSessionUtils]=INFO`, `logging.level.[org.mybatis.spring.transaction.SpringManagedTransaction]=INFO`로 이 두 로거의 반복 DEBUG만 줄인다. WARN/ERROR 및 다른 로거는 유지한다. 설정 반영에는 Backend 재시작이 필요하다.
- 실제 로컬 설정에서 두 항목이 누락되어 반복 출력이 재발한 경우를 보완했다. `MyBatisSessionLoggingConfig`는 ApplicationReadyEvent마다 이 두 로거만 INFO로 맞추며 DevTools 자동 재시작에도 적용한다. 매퍼 SQL 로거와 실제 장애 기록은 유지한다.

- 신규 DB: `001_init_schema.sql` v32. 기존 v31: `026_async_moderation.sql` 한 번 적용 후 Backend 반영.
- `ai.moderation.worker-enabled` 기본 true, `poll-ms` 기본 1000, `initial-delay-ms` 기본 5000.
- 테스트에서는 worker-enabled=false로 실제 사용자 작업 소비와 Gemini 호출을 막는다.
- 실패 작업 확인: `SELECT job_id,target_type,target_id,content_version,attempt_count,last_error_code,last_error FROM ultary_ai_moderation_job WHERE status='FAILED' ORDER BY job_id DESC;`
- 장애를 해결한 뒤 해당 FAILED 작업을 PENDING, attempt_count=0, next_attempt_at=NOW()로 되돌려 재검사할 수 있다. 결과 적용 시 최신 버전·삭제 여부·claim token을 다시 확인한다.
