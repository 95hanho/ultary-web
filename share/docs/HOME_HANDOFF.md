# 집에서 이어서 작업할 때 사용할 프롬프트

아래 내용을 읽고 현재 코드와 Git 상태를 먼저 확인한 뒤 ULTARY 개발을 이어가 주세요.

## 프로젝트와 작업 기준

- ULTARY는 Spring Boot BE `ultary-api`와 Next.js FE/BFF `ultary-web` 두 저장소로 구성됩니다. 둘 다 확인하세요.
- 회사 경로: BE `D:/workspace/java/ultary-api`, FE `D:/workspace/nextjs/ultary-web`. 집에서는 실제 체크아웃 경로를 사용하세요.
- 두 저장소의 작업 브랜치는 `main`입니다. 각 저장소를 최신 커밋으로 맞추세요.
- Cursor에서 Codex로 작업 도구를 전환했습니다. `share/`는 두 저장소에 같은 내용으로 미러링합니다.
- 각 저장소의 AGENTS.md를 따르세요. FE는 설치된 Next.js의 `node_modules/next/dist/docs/` 관련 문서를 읽고 수정하세요.
- 현재 코드와 최신 문서가 우선입니다. 과거 CHANGELOG의 폐기된 정책을 다시 적용하지 마세요.

## 반드시 유지할 현재 정책

- 게시글 작성·수정: 저장 전 동기 AI 검사. 통과한 경우만 저장. 전체 로딩은 검정 dim 30% + 중앙 회전 아이콘입니다. 부적절 판정은 작성 화면에서 사유 모달을 띄우고 닫으면 본문에 포커스합니다. AI 장애는 사용자 위반으로 처리하지 않습니다.
- 댓글·답글: 저장 후 DB 영속 작업으로 비동기 검사합니다. 오류 로그를 독립 저장하고 관리자가 유지/삭제조치를 할 수 있습니다. 예전 작업이 새 수정 내용을 덮어쓰지 못하게 버전을 검사합니다.
- 태그 추천은 동기이며 총 3회 시도합니다. Gemini 기존 model/base-url/timeout/fallback 설정과 low thinking 정책을 유지하세요.
- 관리자 태그 요청·신고·AI 오류 목록에서 상태를 직접 선택합니다. 태그 거절 사유는 필수입니다. 상태 변경 후 메뉴 숫자를 갱신합니다. 신고 상세는 읽기 전용 Feed 미리보기를 제공합니다.
- 거절 태그는 기존 게시글에 남지만 새 게시글에서 검색/추천/추가할 수 없고 설명 팝업도 없습니다. 기존 게시글 수정 시 이미 연결된 태그를 유지할 수 있습니다.
- 차단은 방향을 구분합니다. 차단한 쪽은 상대 검색/프로필에 접근하되 소개 아래를 가립니다. 차단당한 쪽은 상대 콘텐츠/검색을 볼 수 없고 직접 URL 접근도 404입니다. 비로그인 공개 열람은 별도 정책입니다.
- 없는 URL/울타리/피드는 404, 로그인 필수 페이지의 비로그인은 로그인 이동, 통신/서버 오류는 실제 상태 숫자와 재시도 UI입니다. 일시적 토큰 재발급 실패에는 인증을 보존하고, 유효하지 않은 refresh는 로그아웃합니다.
- SMS 실발송은 하지 않고 local 데모 인증번호를 연락처 아래에 표시합니다. 요청 성공 중복 안내는 없습니다. 인증 안내/오류·입력 오류는 해당 입력 아래, 가입 요청 자체의 서버/통신 오류만 상단에 표시합니다.
- 작성 사진/편집 결과/사진 태그는 브라우저 메모리에 보관합니다. 데이터가 남으면 단계 간 이동을 유지하고, 없으면 메인으로 이동합니다. 별도 단계별 저장 API 3개와 통합 설정 GET/PATCH, 501 스켈레톤은 삭제했습니다. 다시 구현하지 마세요.
- 실제 SMS 연결과 스토리 24시간 만료 복원은 데모 정책상 보류합니다. 타입·문서·목업 일괄 정리는 기능 작업 마지막에 하기로 했습니다.

## 집 PC 실행 준비

1. 회사에서 만든 두 커밋이 원격에 push됐는지 확인하고 각 저장소에서 `git pull --ff-only` 하세요. 회사에서는 커밋만 요청했으므로 push 여부를 별도로 확인해야 합니다.
2. BE Java 17, FE는 저장소가 요구하는 Node 버전을 사용하세요. FE 최초 설치는 `npm ci`입니다.
3. 실제 BE `src/main/resources/application*.yml`, FE `.env`, `.env.local`은 Git 제외입니다. 집에 없으면 각 config-samples 및 `.env*.example`을 참고해 설정하세요. 기존 집 설정을 덮어쓰지 마세요.
4. DB/JWT/Gemini 키와 업로드 경로를 집 환경에 맞추고, BE와 FE의 BFF_INTERNAL_KEY를 동일하게 설정하세요. 비밀값은 프롬프트/문서/커밋에 넣지 마세요.
5. 현재 회사 연결 DB에는 schema v38까지 적용했습니다. 집에서도 같은 DB면 중복 적용하지 마세요. 다른 DB면 실제 컬럼/적용 상태를 확인한 뒤 필요한 migration만 순서대로 적용하세요. 기존 DB에 001_init_schema.sql을 실행하지 마세요. 최근 migration은 029~032이며 마지막은 AI 로그 inspection_content 추가입니다.
6. DB MCP 설정도 PC별입니다. 먼저 연결 상태를 확인하고 실제 데이터를 임의로 삭제하거나 덮어쓰지 마세요.

## 실행 명령어 (PowerShell, 각 터미널)

BE 폴더:
```powershell
.\gradlew.bat bootRun
```
BE 자동 컴파일을 사용할 때만 별도 터미널:
```powershell
.\gradlew.bat -t classes
```
FE 폴더:
```powershell
npm run dev
```
기본 주소는 FE http://localhost:3000, BE http://localhost:9377 입니다.

## 마지막 검증과 주의점

- BE: 관리자/AI/게시글/태그 관련 선택 테스트 45개 통과. 미사용 API 삭제 후 빌드 및 PhoneDemoIntegrationTest 2개 통과.
- FE: 아래 122개 회귀 테스트, 타입 검사, 관리자·회원가입 변경 파일 린트 통과.
```powershell
node --test scripts/test-signup-feedback.mjs scripts/test-admin-list-actions.mjs scripts/test-auth-session.mjs scripts/test-ultary-route.mjs scripts/test-tag-review-story.mjs
npx tsc --noEmit
```
- Gemini 실제 제공자 호출과 전체 브라우저 사용자 흐름 검증은 완료했다고 간주하지 마세요. 작성 화면/댓글 컴포넌트에는 기존 React 훅 린트 오류가 남아 있어 전체 린트가 모두 통과한 상태는 아닙니다.
- 삭제한 route의 타입 캐시 오류만 발생하면 `node node_modules/next/dist/bin/next typegen`으로 재생성하세요. 캐시 전체 삭제나 서버 재시작은 문제 원인을 확인한 후에만 하세요.

## 다음 작업

우선 주요 사용자 흐름을 통합 검증하세요: 회원가입·로그인 → 게시글 작성/수정·AI 정상/차단/장애 → 본인/타인/비로그인의 공개 범위 → 차단 → DM → 신고·관리자 조치·알림/메뉴 숫자 반영.
자동 테스트와 실제 브라우저 검증을 구분하고, 운영 데이터 대신 식별 가능한 테스트 데이터를 사용하세요. 실제 SMS·Gemini 비용이 발생하는 호출이나 데이터 삭제를 검증에 무작정 포함하지 마세요.
확인된 결함은 원인을 설명하고 현재 정책을 유지하는 범위에서 수정·검증하세요. 사용자 결정이 필요한 서비스 정책만 질문하세요.
그 다음 후보는 오래된 타입/문서/목업 fallback 정리(마지막 단계), 공개 울타리·공유 피드의 OG 이미지/robots/sitemap/canonical 보완입니다. 포트폴리오 수준을 목표로 합니다.
관련 상세는 share/docs/ai-manual-review-and-phone-demo.md, async-moderation.md, directional-block.md, page-errors.md, tag-review-and-feed-story.md, admin-report-preview.md에 있습니다.
