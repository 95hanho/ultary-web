# share CHANGELOG

FE / BFF / Spring 공통 스펙(`share/`) 변경 기록.  
validation · database · docs 모두 **여기 한곳**에 적는다.

형식: `## YYYY-MM-DD HH:mm` (하루 여러 번이면 시·분 단위로 항목을 나눈다)

---

## 2026-09-28 17:16

### API · 추천 게시글 (임시)
- `GET /api/v1/main/feeds/recommended` 메인 추천 게시글
- `GET /api/v1/main/search/recommended` 검색 추천 게시글
- 나중에 추천 알고리즘 추가해야함. 지금은 조회 가능한 전체 피드를 최신순 `limit`건
- 응답은 `FeedResponse` 배열 (`authorProfileFile`, `media[].file` 포함)

## 2026-09-28 16:57

### API · 댓글·답글 작성자 프로필
- 댓글·답글 조회·작성·수정·좋아요 응답에 `authorProfileFile` (`FileSummary | null`)
- 작성자 유저 프로필 사진. 미등록이면 `null`
- 댓글 목록에 답글이 포함되면 답글에도 동일
- FE 아바타는 `authorProfileFile.filePath`. 없거나 `null`이면 기본 이미지

## 2026-09-28 15:40

### API · 메인 피드 작성자 프로필
- `GET /api/v1/main/feeds` 각 항목에 `authorProfileFile` (`FileSummary | null`) 추가
- 작성자 유저 프로필 사진. 미등록이면 `null`. 게시글 미디어(`media[].file`)와 별개
- 단건 `GET /api/v1/feeds/{feedId}`에도 같은 필드
- FE 카드 아바타는 `authorProfileFile.filePath`. 없거나 `null`이면 기본 이미지

## 2026-09-28 10:41

### API · 스토리 링 프로필
- `GET /api/v1/main/stories/owners` 각 항목에 `profileFile` (`FileSummary | null`) 추가
- 유저 프로필 사진. 미등록이면 `null`. 스토리 미디어는 여전히 없음
- 정렬 유지: `hasUnviewed=true` 먼저, 그다음 최신 스토리
- FE 링 아바타는 `profileFile`이 있으면 그 `filePath`, 없으면 기본 이미지

## 2026-09-28 09:30

### schema v9 · 댓글·답글 좋아요
- `ultary_feed_comment_like` / `ultary_feed_reply_like` + `like_count`
- 댓글·답글 조회에 `likeCount`, `likedByMe`
- `POST|DELETE /feeds/{id}/comments/{commentId}/like`, `.../replies/{replyId}/like`
- 기존 DB: `003_comment_reply_like.sql`

## 2026-09-23 10:45

### Spring · local 스토리 읽음 초기화
- `DELETE /api/v1/test/story-views` (`@Profile("local")`, Bearer) — 내 `ultary_story_view` 전부 삭제
- FE: development에서만 호출. prod 프로필에서는 빈 미등록

## 2026-09-23 10:35

### seed · 스토리 테스트 보강
- CDN `story5.png`~`story10.png` (file 134~139)
- 주민 102·103 스토리 각 +3 → 유저당 4개 (`story_id` 101~110), `created_at` 간격으로 ASC 재생 테스트

## 2026-09-23 10:25

### docs · 스토리 단건 읽음 + FE 재생
- `GET /main/stories?userNo=` 각 항목 `viewedByMe` (이미 API 제공) — FE는 첫 미열람부터, 전부 읽었으면 index 0
- owners `hasUnviewed` = 유저 단위 링 / `viewedByMe` = 스토리 단건 구분 명시
- `api-memo.md` · `API_CONTRACT.md` 반영

## 2026-09-22 17:50

### Spring · share 적용
- `GET /api/v1/feeds/{feedId}` PUBLIC 게스트 조회 (`spring-auth-api.md` §0·§2)
- FileSummary 임베드 + CDN 시드 · StoryOwner 링 메타 분리 (기존 14:45·15:05)

## 2026-09-22 17:24

### docs · 인증 FE/BFF 적용 + Spring 가이드
- `auth-access.md` 상태: FE/BFF 1차 적용 반영
- `spring-auth-api.md` 추가 — Spring이 적용할 게스트 단건 GET·쓰기 401·nickname (복붙용 §0)
- BFF: middleware(페이지 가드, refresh 없음), requireAccessToken/withAuth(Spring refresh), `/feeds/:id` 공유 페이지(실데이터→목업 폴백)
- `api-memo` · `API_CONTRACT`에 게스트 GET / spring-auth-api 링크
## 2026-09-22 16:07

### docs · 인증 접근 규칙 (설계)
- docs/auth-access.md 추가
  - 로그인·회원가입 등 제외 → 미인증 시 로그인 페이지
  - 공유 URL/카카오 단건 피드는 게스트 열람 허용
  - 로그인 모달: 닫기 가능, 사진 넘김·좋아요·댓글 등 모든 액션 시 재표시
- API_CONTRACT.md · README.md에 링크

## 2026-09-22 15:05

### docs · StoryOwner
- `/main/stories/owners`는 FileSummary 미포함 (링: 보유 여부 + `hasUnviewed`만)
- 읽음은 `POST /stories/{id}/view` → `ultary_story_view` (`INSERT IGNORE`, 본인 스토리는 미기록)

## 2026-09-22 14:45

### docs · API 응답 설계
- 읽기 API에 **FileSummary** 임베드 (`file` / `profileFile` / `coverFile` / `images` 등)
  - `filePath` = 업로드 상대경로 또는 CDN 절대 URL → 피드·스토리 스크롤 시 추가 `/files/{id}` 불필요
- `api-memo.md` · `API_CONTRACT.md` 반영
- 시드 CDN file_id 110~141 안내 갱신

## 2026-09-18 16:33

- 불필요 파일 삭제: `docs/api-memo.md`(리다이렉트 스텁), 루트 `database/`(잔여 스키마)
- 안내 문구 정리: 공유 본문은 `share/`만, web 전용은 `docs/bff/`만

## 2026-09-18 15:55

- CHANGELOG를 `share/CHANGELOG.md` 한곳으로 통합 (`validation/CHANGELOG.md` 제거)
- 로그 헤더를 날짜+시분(`YYYY-MM-DD HH:mm`) 형식으로 통일

## 2026-09-18 15:47

### docs · database · 레포 통합
- **SoT를 `share/`로 단일화**
  - `docs/api-memo.md` → 구버전 폐기, `share/docs/api-memo.md` 리다이렉트 스텁으로 교체
  - 루트 `database/schema|seed` (구 스키마·이중 시드) **삭제** → `share/database/`만 유지
- `share/docs/api-memo.md`: FE BFF 문서·validation·계약 링크 추가
- `share/docs/API_CONTRACT.md`: 양 레포(web/api) 공통 문구로 정리, 구 경로 안내
- 참조 갱신: `README.md`, `docs/bff/*`, `http/bff.http` 시드 경로
- 구분: `docs/bff/` = web 전용 BFF 가이드 / `share/` = FE·Spring 공유 스펙

## 2026-09-18 15:39

### validation
- `share/validation/` 최초 정리 (nickname / password / phone / handle / hashtag)
- Spring 입력 검증 오류 응답을 ApiResponse(`success` / `code` / `message` / `data`)로 통일
- `rules.json`을 FE/BFF·Spring `*Rules.java` 동기화용 기계 판독 스펙으로 둠
