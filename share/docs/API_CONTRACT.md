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
| `GET /main/stories?userNo=` · `GET /my-ultary/stories` | 각 항목 `viewedByMe` | **스토리 단건** 읽음 (`ultary_story_view`) |
| `POST /stories/{storyId}/view` | — | 해당 `storyId`만 INSERT IGNORE (본인 스토리는 미기록) |

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
