# share CHANGELOG

## 2026-10-26 Cafe24 HTTPS 정책 확정

- 사용자 결정으로 BE prod의 원본 HTTPS 검사만 해제(require-https=false). BFF 키 인증, FE 운영 HTTPS 요청, 브라우저 WSS 요구는 유지한다.
- 앞단 TLS 종료/프로토콜 헤더 미전달에 맞춘 설정이며, 이전 프록시 신뢰 설정 TODO보다 우선한다. BFF 필터 13개·WAR 빌드 검증 완료.

## 2026-10-26 WAR YAML 인코딩 수정

- Windows WAR 필터 기본 charset으로 인한 YAML 손상/배포 시작 실패를 재현하고 UTF-8로 고정했다.
- bootWar 후 설정 UTF-8 자동 검증 추가. 새 ultary.war의 한글/설정 원본 일치·prod 기본값·local 설정 제외 확인. 서버 재배포 확인은 별도다.

## 2026-10-26 Cafe24 WAR 이름 확정

- bootWar 결과를 ultary.war로 변경했다. Cafe24 /tomcat/webapps에 배포하여 /ultary 컨텍스트를 사용한다.
- clean bootWar로 생성 확인. 기존 ROOT 애플리케이션은 이 작업에서 변경하지 않았다.

## 2026-10-26 운영 FE 주소 확정

- https://ultary-web.vercel.app을 SEO/canonical/OAuth 기준 origin으로 운영 env와 예제에 반영했다. 로컬 개발 주소는 유지한다.
- 기존 OAuth 값을 실제 운영 env에 복사하고 BE prod 웹소켓 origin 기본값을 반영했다. 비밀 파일은 Git/WAR에서 제외한다.
- Vercel 변수 등록·재배포, 공급자 callback 등록 및 Cafe24 BE 실행 환경 주입은 별도 작업이다.

## 2026-10-26 BE 전체 테스트 정리

- 구 비동기 게시글 수정 복구 테스트를 동기 검사 거절 시 원문/태그 보존·승인 후 저장 검증으로 교체했다. 실제 AI 호출은 mock으로 격리했다.
- 최근 검색 기대값을 방향성 차단 정책에 맞췄다. 내가 차단한 상대는 노출, 나를 차단한 상대는 제외되는지 개별 ID까지 검증한다.
- 서비스 코드/DB 스키마 변경 없이 Gradle 전체 테스트 157개 통과.

## 2026-10-26 전체 lint 정리

- React 상태 초기화·hydration·이벤트 ref·effect 의존성과 접근성/미사용 코드 수정
- 규칙 비활성화 없이 전체 lint 0 errors/0 warnings, 회귀 137개 및 운영 빌드 통과
- 댓글 시트 닫기/재열기·사진 변경 후 크롭 저장 브라우저 확인, 검증용 임시 페이지 제거


## 2026-10-26 브랜드 이미지·공개 SSR 확인

- 사용자 favicon.png/og-image.png를 기본 파비콘·공유 이미지에 연결, 기존 기본 favicon/생성 OG route 제거
- 공개 울타리·피드의 실제 HTML 본문에 닉네임/소개말·작성자/본문 포함 확인(비로그인, JS 미실행)
- 실제 대표 사진 우선 정책 유지, 로그인/일반 공유/사진 없는 콘텐츠는 제공된 공통 이미지 사용


## 2026-10-26 로그인·공개 콘텐츠 SEO

- 전체 noindex 기본값과 로그인/공개 울타리/공유 피드 예외, canonical·OG·Twitter 대표 이미지 적용
- robots/sitemap 및 BFF 인증 공개 목록 API 추가. 비공개·삭제·정지·탈퇴 제외, DB 변경 없음
- 운영 origin 미정 시 색인 차단, 대표 사진 없는 경우 1200×630 공통 OG 제공
- FE 137개·BE SEO/차단 10개 테스트, 타입·변경 파일 lint·운영 빌드 및 HTTP 이미지 확인


## 2026-10-26 배포 준비 점검

- 최신 전달 파일/공유 문서 일치와 로컬 DB v38/BFF 설정 확인
- FE 127개·BE 선택 31개 회귀, FE 운영 빌드·실행, ROOT.war 생성/내부 구성 확인
- 빈 APP_URL fallback 수정, WAR에서 실제 로컬 설정 제외·prod 환경변수 설정 패키징
- 읽기용 인계 문서 제거, 배포 점검 결과와 SEO·lint·운영 설정 후속 항목 기록


## 2026-10-23 회원가입 안내·미사용 API 제거

- 회원가입 인증 안내/실패는 연락처·인증번호 아래에 표시, 데모 요청 성공 안내 중복 제거
- 서버 필드 검증과 중복 입력 오류도 해당 입력 아래에 표시, 연락처 변경 전 응답 무효화
- 사용하지 않는 작성 저장 API 3개와 통합 설정 GET/PATCH의 BE/BFF/엔드포인트/요청 예시 제거
- 미사용 501 공통 헬퍼·오류 코드 제거. 작성 데이터가 없으면 메인으로 이동
- BE 빌드·데모 인증 2개, FE 122개 회귀·타입 검사·회원가입 변경 파일 린트 통과


## 2026-10-23 관리자 목록 처리·게시글 사전 검사

- 태그 요청·신고·AI 오류 목록에 상태 선택 적용, 태그 거절 사유 필수 및 메뉴 건수 갱신
- AI 로그 목록·상세의 검사 본문 조회, 저장 전 검사 초안 보관용 DB v38 migration 추가·적용
- 게시글 작성·수정은 AI 통과 후 저장, 전체 로딩·차단 모달 종료 후 본문 포커스. 댓글·답글 후처리 유지
- 이전 검사 결과가 새 승인 수정을 덮어쓰지 않도록 승인 버전 갱신
- 회원가입 상단 배너 조건과 501 작성/통합설정 API 현황 설명; 해당 API는 미변경
- BE 45개·FE 115개 통과, FE 타입 검사·관리자 변경 파일 린트 통과. 작성 화면의 기존 훅 린트 오류는 미변경


FE / BFF / Spring 공통 스펙(`share/`) 변경 기록.  
validation · database · docs 모두 **여기 한곳**에 적는다.

형식: `## YYYY-MM-DD HH:mm` (하루 여러 번이면 시·분 단위로 항목을 나눈다)

---

## 2026-10-23 16:15

### 거절 태그 신규 사용 차단·AI 장애 관리자 처리·휴대폰 데모
- 거절 태그의 기존 피드 연결만 유지, 작성 검색·추천·신규 연결 거부. 설명 팝업 숨김 유지
- 태그 추천 총 3회 시도 후 서비스 오류 안내, 게시글 작성도 저장 후 DB 작업자로 검사
- 관리자 AI 오류 기본 필터를 게시글·댓글·답글로 변경, 오류 상세에서 유지/삭제조치 및 본문 버전 보호
- 휴대폰 데모 응답·세 화면 코드 표시, 인증 무조건 성공 분기 제거 및 실제 코드 검증 유지
- DB v37 migration 적용. BE 42개·FE 109개 회귀, 타입/변경 파일 린트 통과
- 상세 docs/ai-manual-review-and-phone-demo.md. 501 API 5개는 설명만 하고 변경하지 않음

---

## 2026-10-23 15:35

### 관리자 태그 요청 표시·피드 수 및 거절 정책 변경
- 목록에 닉네임(user_no)과 요청일 inline 배치, 상태 아래 변경일 표시
- 목록 - N Feeds 및 상세 태그 피드 수 N개 추가. 삭제된 피드·연결은 집계에서 제외
- 상세 외부 링크를 글자 영역만 클릭되도록 변경. 연결 피드 목록은 추가하지 않음
- 거절 요청은 이력을 유지하고 태그는 USER/NONE으로 전환: 일반 태그 검색·사용 허용, 설명 팝업 제거. 대기 전환은 COMMERCIAL/PENDING
- 설명 재조회가 오래된 승인 응답을 계속 사용하지 않도록 진행 중 요청만 공유
- schema v36 migration 적용: status_changed_at 및 기존 거절 태그 전환. Gemini/SMS/스토리 기능은 변경하지 않음

---

## 2026-10-23 14:38

### 태그 대기 전환 요청 시간 초과 복구
- 실행 중 Next 개발 서버에서 대기 Route Handler 진입 전 요청이 멈춤. 승인·메뉴 조회는 정상 응답
- 서버 재시작만으로 해소되지 않아 기존 .next/dev를 보관하고 개발 캐시 재생성 후 서버 재기동
- 대기 API의 인증 없는 진단 요청: 복구 전 15초 시간 초과, 복구 후 정상 401 응답 약 0.4초. 실사용 요청 상태는 진단으로 변경하지 않음
- 관리자 form HTTP API를 통한 거절→대기 회귀 테스트 추가. DB 요청·태그 상태 및 최근 알림 삭제 확인. 태그 통합 7개 통과

---

## 2026-10-23 14:27

### 태그 요청 대기 전환 UI와 최근 심사 알림 정리
- 별도 대기로 돌리기 버튼 제거, 오른쪽 상태 선택의 대기 옵션 사용. 처리 중 선택 비활성화
- 상태 변경 시 같은 요청의 최근 2분 이내 생성된 심사 알림 정리 후 새 승인·거절 알림 생성. 대기 전환은 삭제만 수행
- 오래된 알림·다른 요청은 유지, 기존 고정 group_key 호환. DB 변경 없음
- 태그 통합 테스트 6개, FE 타입 검사 및 변경 컴포넌트 린트 통과

---

## 2026-10-23 14:23

### 관리자 신고 상세의 피드 원문 미리보기
- 상세를 신고 정보/최대 430px Feed로 분할하고 관리자 읽기 전용 모드 추가
- 댓글만 액션에 남기고 스토리·울타리 이동, 댓글 작성·답글·공감·메뉴 숨김. 태그 설명 유지
- 신고에 연결된 비공개·삭제 조치 원문과 이미지의 관리자 전용 조회 API/BFF 추가
- BE 통합 4개, FE 타입 검사·태그/스토리 회귀 5개 통과. 브라우저 검증용 데이터로 UI 확인
- DB 변경 없음. 상세 docs/admin-report-preview.md

---

## 2026-10-23 14:07

### 태그 심사 상태·알림·작성 제한과 피드 스토리 프로필
- 관리자 상세의 선택한 요청을 승인·거절·대기로 변경, 거절 목록 배경 red-100 적용
- 태그 승인·거절 알림 저장 및 기존 실시간 배지 연결, 태그 링크와 거절 색상·사유 문구 적용
- 요청 태그는 승인 시에만 새 게시글에 사용. 거절·대기 전환 후 기존 피드 태그 연결 유지
- 피드·댓글·답글 작성자 스토리 상태 응답 및 공통 Profile/스토리 링크 적용
- DB schema v35: 태그 심사 알림 enum 확장. 상세 docs/tag-review-and-feed-story.md

---

## 2026-10-23 11:35

### 방향별 차단 검색·울타리·콘텐츠 접근 정책
- 차단한 쪽은 상대 검색·기본 울타리 조회 허용. 소개말 아래는 차단한 유저입니다.로 대체
- 차단당한 쪽은 검색 제외, 울타리/게시글 목록/피드/스토리 직접 접근을 일반 404로 은닉
- 제3자 게시글의 댓글·답글과 스토리 노출도 차단 관계 필터링, 회원 metadata의 공개 프로필 우회 방지
- BE 롤백 통합 테스트 16개·FE 회귀 테스트 103개·타입 검사 통과. DB 구조 변경 없음
- 상세 docs/directional-block.md

---

## 2026-10-23 11:11

### 상대 울타리에서 차단하기
- 닉네임 옆 더보기 메뉴에 차단하기를 추가하고 기존 사용자 차단 API 연결
- 처리 중 중복 클릭 방지, 성공 시 메인 이동, 실패 시 알림 모달
- 기존 차단 API의 팔로우·맞팔·알림 정리 및 해제 후 관계 미복구를 롤백 통합 테스트 3개로 확인
- FE 타입 검사 통과. 기존 MyUltaryClient의 effect 관련 린트 오류는 별도 정리 대상
- 상세 docs/profile-block.md. DB 구조 변경 없음

---

## 2026-10-23 10:59

### 로그인한 사용자의 피드 단건 차단 검사
- 피드 공통 접근 검사에 활성 양방향 차단 검사 추가. 로그인 차단 관계는 403 USER_BLOCKED로 거부
- 동일 검사를 쓰는 좋아요·댓글 등에도 적용. 비로그인은 기존 전체공개 정책 유지
- 기존 차단 Mapper 재사용, DB 변경 없음. 롤백 통합 테스트 4개 통과

---

## 2026-10-23 09:05

### 페이지 오류 숫자 및 API 오류 코드 구분
- 403을 404로 변환하던 흐름을 분리하고 공통 조회 오류 화면에 403·500·502·503·504 숫자 표시
- 기존 오류 문구·새로고침 버튼 및 없는 리소스의 404 화면 유지
- BFF 오류 응답에 HTTP 상태와 일치하는 status 및 세부 code 제공, 기존 Spring 오류 코드 보존
- 공개 피드·울타리 SSR 및 관리자·댓글 조회에서 오류 상태 보존. 네트워크 실패 502·시간 초과 504 구분
- 타입 검사·변경 파일 린트·회귀 테스트 102개 통과. 상세 docs/page-errors.md

---

## 2026-10-22 18:01

### 로그인 이동 및 재발급 장애 시 세션 보존
- 비로그인 회원 경로는 로그인으로 이동하고, 없는 URL·울타리·피드는 404 유지
- Refresh 통신 장애는 2회 재시도 후 503 반환, 쿠키 유지. 새로고침 시 재시도 가능
- 잘못된 Refresh 인증은 즉시 쿠키 삭제·401 처리. 인증 실패와 서비스 장애 구분
- 로그인한 공유 피드는 BFF에서 조회해 Access 만료 복구 적용
- 회원 경로 목록을 실제 페이지 파일과 비교하는 회귀 테스트 추가. DB 변경 없음

---

## 2026-10-22 17:34

### 페이지 접근 불가와 일시 조회 오류 구분
- 로그인 필요·권한 부족·삭제·존재하지 않는 페이지는 기존 공통 404 화면 표시
- 비로그인 보호 경로는 원래 URL을 유지하는 404 rewrite, 캐시 금지·검색 제외
- 서버·통신 장애에는 기존 새로고침 오류 화면 유지. 페이지 조회 응답 상태를 보존해 분류
- 게시글 수정 진입 실패가 빈 작성 화면보다 먼저 표시되도록 수정. DB·API 권한 정책 변경 없음

---

## 2026-10-22 17:22

### 공개 울타리 게스트 조회·페이지 제목
- 공개 계정의 울타리 루트에 비로그인 접근 허용. 서버 전용 공개 프로필 API로 안전한 프로필·공개 그리드만 조회
- 로고·로그인 헤더 및 기존 울타리 UI 재사용, 게스트의 팔로우·DM·신고·하단 메뉴 숨김
- 공개 참조 파일만 익명 content 허용. 비공개 계정·게시글·삭제·다른 회원 API의 인증 정책 유지
- 울타리·스토리·검색·알림 제목 적용, 기본 Ultary. 공개 울타리 canonical·OG 기본 정보·공개 여부별 robots 설정
- 상세: docs/public-ultary-seo.md. DB 변경 없음

---

## 2026-10-22 10:48

### 검색 결과·최근 검색의 프로필과 스토리
- 검색 화면 USER·MENTION 결과 및 최근 검색 USER 사진을 공통 Profile로 변경. 사진 47px, 전체 영역 55px 유지
- 각 API에 조회자 기준 hasStory·hasUnviewed 추가. 최근 검색 더보기·저장 응답도 동일 적용
- 사진은 스토리가 있을 때만 해당 사용자 스토리로 이동. 스토리 없는 사진은 검색창 포커스를 유지하고 아무 동작 없음
- 닉네임·펫태그 울타리 이동, 검색 기록 저장·삭제·더보기 동작 유지. DB 스키마 변경 없음

---

## 2026-10-22 09:35

### 팔로우·팔로워 목록의 프로필과 스토리
- 목록 사진에 공통 Profile 적용. 기존 사진 47px, 전체 영역 55px 유지
- 목록 API에 조회자 기준 hasUnviewed 추가. 기존 hasStory와 함께 없음·읽음·미열람 테두리 표시
- 사진 클릭은 해당 사용자의 스토리만 재생, 스토리가 없으면 사진 클릭 동작 없음. 닉네임은 울타리 연결 유지
- 비공개 스토리와 접근 권한을 기존 스토리 정책으로 검사. DB 스키마 변경 없음

---

## 2026-10-21 17:40

### 최근 검색·DM·게시글 공개 범위
- 최근 검색은 최초 5개, 더보기마다 20개 추가. 전체 건수와 태그별 게시글 수를 공개 범위에 맞춰 반환
- 새 DM은 첫 메시지를 보낼 때 대화방 생성과 전송을 같은 트랜잭션으로 처리. 목록의 더보기 메뉴에서 내 채팅방 삭제 지원
- 게시글 작성·수정의 사진 태그 아래에 전체·팔로우·나만 선택 추가. 새 글은 계정 기본값, 수정은 기존 값으로 초기화
- 공개 범위는 기존 DB/API를 재사용. 사진 태그 화면 이동 시 선택 유지, 제목 크기·굵기·위치를 다른 작성 항목과 통일
- 상세: docs/recent-search-pagination.md, docs/dm-first-message.md, docs/feed-visibility.md

---

## 2026-10-21 16:29

### FE 환경 파일 6종 분리
- 공통 `.env`, 로컬 `.env.local`, 운영 `.env.production` 및 각 `.example`으로 정리
- 기존 OAuth 설정과 환경별 BFF 키 보존. 실제 설정 3개는 Git 제외, 예제는 비밀값 없이 공유
- npm 개발/빌드/운영 실행에서 공통 파일과 선택 환경 파일을 먼저 로드하여 Next 기본 로컬 우선순위 처리
- 운영 URL은 실제 주소 입력 필요. 환경별 FE/BE 키 일치와 Next 로딩 결과 확인

---

## 2026-10-21 16:14

### BFF 서버 전용 공유 키와 프로덕션 HTTPS
- local/prod 모두 Spring REST `/api/v1/**`에 X-BFF-Key 필수. 기존 사용자 JWT와 별도 인증
- 환경별 독립 키를 비공개 FE env/BE yml에 준비. 공유 example/sample은 빈 키 또는 환경변수 참조만 포함
- Next 일반 호출·재발급·파일 스트리밍에 키 적용, 고정 오리진 및 수동 리다이렉트 정책으로 키 전달 제한
- prod는 Next에서 HTTP 전송 전 차단, Spring은 TLS 또는 지정한 신뢰 프록시의 HTTPS만 인정
- 브라우저 WebSocket은 키를 노출하지 않고 기존 일회용 티켓 유지, prod WSS 제한. 티켓 REST API는 키 필수
- 개발 HTTP 요청 예제에 환경변수 기반 헤더 추가. DB 변경 없음

---

## 2026-10-21 15:38

### schema v34 · 재발급 경쟁 및 만료 Access Token 복구
- 회원/관리자 재발급·로그아웃을 DB 계정 행 잠금으로 직렬화. 토큰 교체 이력과 새 발급을 같은 트랜잭션으로 저장
- 최초 회전 후 20초 이내 중복 요청은 같은 세션의 활성 후속 Refresh Token 반환. 유예 시간 연장·다른 세션·로그아웃된 세션 복구 차단
- BFF 공통 API에서 401 TOKEN_EXPIRED일 때만 재발급 및 원래 업무 요청 1회 재시도. 쿠키 최신값 보존, 회원/관리자 구분
- application/problem+json 오류 코드 파싱. 공유 피드 SSR 직접 조회는 쿠키 변경 불가로 명시적 제외
- migration: 028_token_rotation.sql. 소셜 로그인 BFF→BE 전용 인증은 추가하지 않음

---

## 2026-10-21 15:12

### 로그인 재발급 재시도 · schema v33 기기별 로그인 세션
- 회원/관리자 재발급 서버 장애는 2초 간격으로 2회 추가 시도. 각 시도 timeout 4초, 소진 시 401 및 해당 인증 쿠키 삭제
- 로그인마다 고유 세션 ID·최초 로그인 시각·클라이언트 IP·브라우저 Agent 저장. 재발급 간 같은 로그인 정보 보존
- JWT에 발급별 jti 추가. 동일 초 로그인 토큰 구분
- 로그아웃은 Refresh Token을 검증하여 현재 로그인 세션만 폐기. 다른 기기 세션은 유지, 비밀번호 변경 등의 전체 폐기 정책 유지
- 일반/구글/카카오 로그인 성공은 메인으로 이동. 이전 URL 쿼리 전달 제거
- migration: 027_login_session.sql. 로그인 기기 목록 화면/조회 API는 추가하지 않음

---

## 2026-10-20 11:02

### 내 게시글 수정
- 내 피드는 고정·저장 대신 수정 메뉴 표시. 기존 작성 화면 재사용, 사진 태그·본문만 편집
- PATCH에 기존 미디어 ID별 태그·본문 해시태그 연결 수정 추가. 원본 파일·순서 유지, 작성자 권한 검증
- 태그 알림 및 사용 건수 동기화, 공동작성자 보존, 본문 복구 시 해시태그 연결 복구. DB 스키마 변경 없음

### 관리자 AI 호출 로그 API
- 게시글 작성은 동기 AI 승인 후 저장하도록 변경. 부적절/장애 사유 모달, 독립 오류 로그, 승인 상태 보존·중복 검사 작업 방지
- 작성 요청 전체 화면 dim·중앙 회전 로딩 컴포넌트 추가. dim 30% 불투명도, 실제 요청 중에만 표시하며 상시 미리보기는 제거
- 관리자 메뉴 건수 failedAiRequestCount 추가. 홈·사이드 메뉴에 실패 호출 로그 전체 건수 표시
- 관리자 홈·사이드 메뉴와 AI 오류 로그 목록/상세 화면 추가: /admin/ai/logs
- 작업 조회 시 반복되는 MyBatis 세션 수명 DEBUG 로거 두 개만 INFO로 조정
- 실제 로컬 설정 누락 재발 보완: ApplicationReadyEvent에서도 해당 두 로거 INFO 적용. 실제 반복 DB 조회의 출력 억제 통합 테스트 추가
- 관리자 전용 목록/상세 API 및 BFF 추가. 기본 오류 목록, 필터·커서 페이지 조회
- 호출 당시 오류와 현재 작업 결과를 함께 반환. 콘텐츠·프롬프트·제공자 응답은 제외
- 비동기 모더레이션 문서에 조회 규약과 작성자 알림 문구 명시

### schema v32 · 비동기 콘텐츠 모더레이션
- 작성/수정은 즉시 저장·공개. 동일 트랜잭션에 DB 검사 작업 등록
- 버전별 순차 검사, 마지막 승인 본문 복구, 신규 콘텐츠 숨김
- AI 장애와 유해 판정 분리. 최대 3회 시도·독립 로그·만료된 작업 lease 복구
- AI_MODERATION 영속 알림, CONTENT_MODERATED/ MODERATION_RESULT 소켓 이벤트
- Gemini HTTP 전체 응답 deadline 적용·키를 헤더로 전달. 태그 추천은 동기 방식 유지
- migration: 026_async_moderation.sql

---

## 2026-10-19 13:40

### schema v31 · 본문 100자
- 게시글·댓글·답글 `content` 최대 **100자** (해시태그 텍스트 포함)
- DB `VARCHAR(100)`. 마이그레이션 `025_content_max_100.sql`
- API `@Size(max=100)`

---

## 2026-10-19 13:35

### API · AI 모더레이션 게시글 확장
- 게시글 `POST`·`PATCH /feeds`: 본문 유해 시 `400` `AI_CONTENT_BLOCKED` (댓글·답글과 동일 문구)
- 본문 비움·`clearContent`·visibility만 변경이면 검사 생략. AI 장애 시 등록 허용
- 로그 `feature_type=FEED_CAPTION` (댓글·답글은 `COMMENT_FILTER`)
- `GET /tags/recommend`: FE는 기존 태그 제외 본문을 `q`로 (스키마 변경 없음)

---

## 2026-10-19 11:15

### schema v30 · 최근 검색 태그 이력
- `ultary_user_search_history`: `target_user_no` nullable, `target_tag_id` 추가. UK (user+user)·(user+tag)
- `POST /main/search/recent` Body `{ targetUserNo }` 또는 `{ tagId }`
- 목록 항목 `type=USER|TAG`. 태그 피드는 `tagId`·`hashtag`
- 마이그레이션: `024_search_history_tag.sql`

---

## 2026-10-19 10:35

### DB · 시드
- 공통 태그 계정 user **100** (`울타리가든` / `01010000100` / `Test1234!`)
- `003_common_tag_catalog.sql`: 종·품종·산책·훈련·목욕·병원 등 USER 해시태그 카탈로그
- 기존 공통 태그(산책·낮잠·간식·공원·집사일상) 소유를 user 100으로

---

## 2026-10-19 10:00

### API · AI (Gemini)
- `GET /tags/recommend`: 게시글 내용 기반 해시태그 최대 5. Gemini 우선, 실패 시 DB fallback
- 댓글·답글 작성·수정: Gemini 모더레이션. unsafe → `400` `AI_CONTENT_BLOCKED`
- 환경변수 `GEMINI_API_KEY`·`GEMINI_MODEL`. 키 없으면 추천은 DB, 모더레이션은 통과
- 요청 로그는 기존 `ultary_ai_request_log` (`HASHTAG`·`COMMENT_FILTER`). 원문·API Key 미저장

---

## 2026-10-16 16:15

### API · 회원 이름 최초 등록
- `PATCH /auth/me`의 `name`: 비어 있을 때만 최초 등록. 이미 있으면 `400` `NAME_ALREADY_SET`
- 카카오 등 OAuth에 이름이 없을 때 회원정보 수정에서 받는다

---

## 2026-10-16 14:50

### API · 관리자 신고 목록
- `GET /admin/reports` 정렬: 대상 회원이 정지면 `REQUESTED`·`CONFIRMED`여도 앞쪽 우선 묶음에서 제외

---

## 2026-10-16 14:25

### API · BFF · 마이페이지 SNS 연동
- `GET /auth/social/google|kakao?intent=link&returnUrl=` 로 로그인 유지 연동. 콜백이 `POST /social/link` 호출
- `POST /social/link`·`DELETE /social/unlink` 응답을 `MeResponse`로 둔다 (`googleLinked`·`kakaoLinked`)

---

## 2026-10-16 14:10

### DB · 시드
- `ultary_user_social` 시드·가짜 연동 제거. 실제 OAuth로 연동한 행만 둔다

---

## 2026-10-16 13:40

### API · 내 회원정보
- `GET /auth/me` 등에 `googleLinked`, `kakaoLinked`. 마이페이지 소셜 연동 여부

---

## 2026-10-16 13:30

### API · 관리자 메뉴
- `requestedReportCount`는 신고요청·확인 합이다

---

## 2026-10-16 10:50

### API · 관리자 신고 목록
- `status`를 비우면 신고요청·확인이 먼저 나오고, 그다음 삭제조치·거절·정지다

---

## 2026-10-16 10:40

### API · DB · 신고 보류 제거
- `ON_HOLD`와 `POST /admin/reports/{reportId}/hold`를 없앤다. 기존 보류는 `CONFIRMED`로 옮긴다 (스키마 v29)

---

## 2026-10-16 10:30

### API · 관리자 신고 조치
- 정지·삭제조치·거절된 신고도 다시 조치할 수 있다
- 정지에서 다른 상태로 바꾸면 회원 정지를 풀고, 다시 정지로 바꾸면 정지한다
- 삭제조치에서 다른 상태로 바꾸면 글·댓글·답글을 복구하고, 다시 삭제조치면 삭제한다

---

## 2026-10-16 09:45

### API · 관리자 신고
- 목록·상세의 `targetUserNo`·`targetNickname`은 글·댓글·답글 신고에서도 작성자를 준다

---

## 2026-10-15 17:30

### API · 정지 회원
- 신고 목록·상세에 `targetSuspended`. 상세는 `GET /admin/reports/{reportId}`
- 정지 회원의 태그 설명 요청은 관리자 목록·건수에서 뺀다
- 정지 회원의 게시글 상세, 댓글, 답글, 그 회원이 만든 태그는 조회하지 않는다
- 신고 상태를 바꿔도 회원 정지나 글 삭제는 되돌리지 않는다

---

## 2026-10-15 14:45

### API · 관리자 메뉴
- `GET /admin/menu-counts`. 태그 설명 대기 건수와 신고 요청 건수만 준다

---

## 2026-10-15 13:30

### API · 관리자 태그 설명
- 승인·거절·대기는 최신 요청의 상태를 다시 바꾼다. `POST /admin/tags/{tagId}/pending`은 본문 없이 대기로 둔다

---

## 2026-10-15 11:45

### API · 관리자 목록
- 태그 설명 요청·신고 목록에 `totalCount`. 같은 `status`의 전체 건수이고, 커서와 `limit`는 세지 않는다

---

## 2026-10-15 09:55

### DB · 신고
- `ultary_report`에서 펫 신고(`PET`, `target_pet_id`) 제거. 대상은 `USER`|`FEED`|`COMMENT`|`REPLY`

---

## 2026-10-14 16:45

### API · 관리자 목록 표시
- 태그 설명 요청 목록에 `requesterNickname`. 신고 목록은 회원 닉네임 `targetNickname`, 글은 `targetContent` 10자

---

## 2026-10-14 15:20

### API · 관리자 목록
- 태그 설명 요청·신고 목록은 `status`를 비우면 전체 최신순. `nextCursorRequestId`·`nextCursorReportId`로 다음 페이지

---

## 2026-10-14 15:25

### API · 회원가입 지역
- `POST /api/v1/auth/signup`에 `regionSido`, `regionSigungu`. 비우면 저장하지 않는다

---

## 2026-10-13 16:35

### API · 상업 태그 거절 멘트
- `POST /api/v1/admin/tags/{tagId}/reject`의 `rejectMessage`를 요청에 저장한다. 신청자 목록에 그대로 나온다

---

## 2026-10-13 16:20

### API · 상업 태그
- 태그 `purpose`는 `USER` 또는 `COMMERCIAL`. 설명은 승인 요청이 `APPROVED`일 때만 태그 조회에 나온다

---

## 2026-10-13 14:50

### API · 공유 대상
- `GET /api/v1/dm/share-targets`. 한 달 DM, 내 팔로우, 팔로워 순. 나머지는 세 시각 중 최신순

---

## 2026-10-13 13:55

### API · 팔로우 알림
- 공개·비공개 팔로우 모두 알림. 문장은 «팔로우를 요청했습니다» 또는 «팔로우했습니다». `following`으로 팔로우/취소. 관계가 있으면 알림을 지우지 않음

---

## 2026-10-13 11:30

### API · 팔로우 수락
- 공개 계정 팔로우는 바로 `ACCEPTED`(한 방향). 비공개 계정은 수락 대기, 수락하면 서로 팔로우(`followed_back`). 맞팔 상태값은 추가하지 않음

---

## 2026-10-12 17:10

### API · DM 팔로우 방향
- 대화방과 `DM_MESSAGE.room`, 메시지 조회에 `following`, `followedBy`. 둘 다 false면 팔로우 관계가 아님

---

## 2026-10-12 16:10

### API · 비공개 계정
- `GET /users/{userNo}/ultary`에 `privateAccount`. 비공개는 조회자가 그 계정을 팔로우할 때만 글·스토리. 그리드 세 개는 빈 배열. `feedCount`는 유지

---

## 2026-10-12 14:55

### API · 팔로우·팔로워
- 주민은 `FOLLOW`(팔로우), 이웃은 `FOLLOWER`(팔로워). 울타리 숫자는 `followCount`, `followerCount`. 스키마 v25는 설명만

---

## 2026-10-12 13:55

### API · 관리자 인증
- `POST /api/v1/admin/auth/login|refresh|logout`. 회원 토큰과 비밀키·쿠키를 분리. `/admin`은 관리자 액세스 토큰만

---

## 2026-10-12 13:20

### API · 주민·이웃 목록
- 목록 항목에 `petTags`, `following`. 상대만 나를 팔로우한 상태에서 이웃 요청은 맞팔로 바로 연결. 스키마 v24

---

## 2026-10-12 11:15

### API · 토큰 만료 여유
- 액세스·리프레시 JWT와 리프레시 DB 만료는 쿠키·`expiresIn`보다 30초 길다. `expiresIn`은 30분 유지

---

## 2026-10-12 09:55

### API · 메인 스토리 링
- `GET /api/v1/main/stories/owners` 맨 앞에 내 활성 스토리. 없으면 주민만. 나머지는 미열람 먼저

---

## 2026-10-08 11:35

### API · 신고 확인
- `POST /api/v1/admin/reports/{reportId}/confirm`. 신고요청만 `CONFIRMED`. 이후 신고 취소 불가
- 스키마 v23

---

## 2026-10-08 11:30

### API · 내 신고 이력과 취소
- 게시글·댓글·답글·울타리 조회에 `myReport` (`reportId`, `status`). 없으면 null
- `status=REQUESTED`만 `DELETE /api/v1/reports/{reportId}`로 취소

---

## 2026-10-08 11:20

### API · 신고 상태
- `status`: `REQUESTED` 신고요청, `DELETED` 삭제조치, `REJECTED` 거절, `ON_HOLD` 보류, `SUSPENDED` 정지
- 보류 `POST /api/v1/admin/reports/{reportId}/hold`. 신고요청·보류만 다시 조치
- 스키마 v22

---

## 2026-10-08 11:10

### API · 신고와 관리자 조치
- `POST /api/v1/reports`. `targetType` USER|FEED|COMMENT|REPLY, `targetId`, `reason` ENUM(SPAM, ABUSE, HARASSMENT, SEXUAL, VIOLENCE, HATE, IMPERSONATION, PRIVACY, OTHER)
- 관리자: `GET /api/v1/admin/reports`, `POST .../reports/{reportId}/delete-content`(게시글·댓글·답글 삭제), `POST .../suspend`(유저 정지), `POST .../reject`
- 스키마 v21. `ultary_report.reason` VARCHAR → 사유 ENUM

---

## 2026-10-08 09:30

### API · 최근 검색 한 건 삭제
- `DELETE /api/v1/main/search/recent/{userSearchHistoryId}`. 목록 항목 id. 내 행만. 없으면 404

---

## 2026-10-07 17:05

### API · 검색 페이지
- `GET /api/v1/main/search`
- `type=USER` 닉네임 → `users[]`
- `type=MENTION` 펫 멘션 → `users[]`. 유저당 한 줄, `petTags`
- `type=TAG` 태그명 → `tags[]` (`tagId`, `hashtag`, `feedCount`). 입력 중과 엔터는 같은 응답. `limit=5` / `20`
- 태그 클릭 `GET /api/v1/main/search/tags/{tagId}/feeds?limit=30`. 보이는 글만 그리드, 최신순. `feedCount`는 이 그리드와 같은 보이는 글 수
- `type=PET`는 스토리 `@` 후보용. 검색 페이지에서 쓰지 않는다

---

## 2026-10-07 16:55

### API · 검색 3종과 태그 게시글 그리드
- `GET /api/v1/main/search`의 `type=USER`는 닉네임, `type=MENTION`은 펫 멘션. 둘 다 `users[]`이고 `petTags` 포함
- `type=TAG`는 해시태그명과 조회자에게 보이는 게시글 수 `tags[].feedCount`. 입력 중과 엔터는 같은 응답, `limit`만 다름
- 태그를 고르면 `GET /api/v1/main/search/tags/{tagId}/feeds`. 보이는 글만 그리드, 최신순

---

## 2026-10-07 16:25

### API · 최근 검색의 펫 태그
- `GET /api/v1/main/search/recent`, `recent/more`, 저장 응답 항목에 `petTags`
- 그 울타리 주인 펫의 `mentionId` 문자열 배열. `@` 없음. `priority` 순. 없으면 `[]`
- 화면에는 각 `mentionId` 앞에 `@`를 붙여 한 줄로 나열한다

---

## 2026-10-07 15:15

### API · 태그 클릭 게시글 수
- `GET /api/v1/tags/{tagId}`의 `data.feedCount`. 그 태그가 달린 게시글 수. 지금 보는 글 포함, 삭제된 글은 제외
- 다른 게시글보기 버튼은 `feedCount > 1`일 때만. 숫자는 `feedCount - 1`
- 이 버튼에 `useCount`를 쓰지 않는다

## 2026-10-07 15:10

### API · 태그 상세의 게시글 수
- `GET /api/v1/tags/{tagId}`의 `data.feedCount`. 그 태그가 달린 삭제되지 않은 게시글 수. 지금 보는 글 포함

---

## 2026-10-07 13:50

### DB v20 · API · 회원 정지
- `withdrawal_status`에 `SUSPENDED`, 컬럼 `suspended_at`
- `POST /api/v1/admin/users/{userNo}/suspend`, `POST /api/v1/admin/users/{userNo}/unsuspend`
- 정지 계정 로그인·리프레시·이후 요청은 `403` `ACCOUNT_SUSPENDED`

---

## 2026-10-07 11:00

### DB v19 · API · 고정 글과 나만 보는 저장
- `ultary_feed_store` → `ultary_feed_pin`, `store_count` → `pin_count`. 기존 행은 고정 글
- 새 `ultary_feed_save`. 목록은 본인 `GET /my-ultary/saved-feeds`만
- 고정은 `POST/DELETE /feeds/{id}/pin`, 목록 `GET /my-ultary/pinned-feeds`, `GET /users/{userNo}/pinned-feeds`
- 저장은 `POST/DELETE /feeds/{id}/save`. 게시글 단건은 `pinCount`, `pinnedByMe`, `savedByMe`
- 기존 `/store`, `saved-feeds`를 다른 사람 울타리 저장으로 쓰던 경로는 없음

---

## 2026-10-07 10:55

### API · 다른 울타리의 저장·태그 글
- `GET /api/v1/users/{userNo}/saved-feeds`, `GET /api/v1/users/{userNo}/tagged-feeds`
- 항목은 게시글 그리드와 같다. 다른 사람이 보면 그 글을 볼 수 있는 경우만
- 나의 `userNo`면 기존 `GET /my-ultary/saved-feeds`, `GET /my-ultary/tagged-feeds`와 같다

---

## 2026-10-07 09:40

### API · DM 읽음과 입력 중
- 읽음이 올라가면 상대에게만 웹소켓 `DM_READ` (`dmRoomId`, `lastReadMessageId`)
- 메시지 조회 `data.peerLastReadMessageId`. 없으면 null
- `POST /api/v1/dm/rooms/{roomId}/viewing`. 둘 다 방을 보고 있으면 새 메시지는 바로 읽음
- `POST /api/v1/dm/rooms/{roomId}/typing`. 상대에게 `DM_TYPING`

---

## 2026-10-07 09:00

### API · 로컬 토큰 초기화
- `DELETE /api/v1/test/tokens` (`local` 프로필만, Bearer). 로그인 유저의 리프레시 토큰을 모두 폐기
- 액세스 토큰은 DB에 없다. 호출한 쪽이 쿠키를 지워야 로그아웃된다
- prod에서는 컨트롤러가 없어 404

---

## 2026-10-06 13:45

### API · 웹소켓
- `POST /api/v1/ws/ticket` 입장 토큰(30초, 1회). 소켓은 Spring `/api/v1/ws` 에 브라우저가 직접 연결
- 첫 메시지로 티켓을 보낸 뒤 `NOTIFICATION_UNREAD`, 새 DM은 `DM_MESSAGE`
- 알림 배지와 DM 보내기는 기존 HTTP를 유지

---

## 2026-10-02 17:10

### DB · API · DM
- 스키마 v18 `ultary_dm_room`, `ultary_dm_message`. 두 사람당 방 1개
- `GET`/`POST /api/v1/dm/rooms`, 나가기, 읽음, 메시지 조회·전송
- 채팅 상대는 기존 울타리 주민·이웃 목록
- 게시글은 고른 사진(`feedMediaId`)과 작성자 프로필·닉네임·본문, 스토리는 그 사진만

---

## 2026-10-02 16:06

### DB · API · 공개 범위
- 스키마 v17 `ultary_user_privacy`. 유저당 1행, 없으면 화면 기본값
- `GET`/`PATCH /api/v1/settings/privacy`
- 비공개 계정은 전체 공개 게시글·스토리를 이웃에게만 보여 줌
- 이웃 신청·댓글·멘션·태그를 끄면 해당 동작이 거절됨

---

## 2026-10-02 15:10

### API · 안 읽은 알림 수
- `GET /api/v1/notifications/unread-count` — 하단 배지. 읽음 처리 없음. `/auth/me`에 넣지 않음
- `GET /api/v1/notifications` — 알림 페이지 진입 시 그때까지 쌓인 안 읽음을 읽음 처리
- 읽음 컬럼은 기존 `ultary_notification.is_read`

---

## 2026-10-02 13:55

### DB · API · 알림 설정
- 스키마 v16 `ultary_notification_setting`. 유저당 1행, 없으면 전부 켜짐
- `GET`/`PATCH /api/v1/settings/notifications` — 화면 스위치 10개
- 끈 종류는 알림 목록·배지에서 빠지고, 그 사이 생긴 알림은 저장하지 않음

---

## 2026-10-02 13:47

### API · 차단한 사용자 목록
- `GET /api/v1/users/blocks` — 내가 차단한 활성 유저. `nickname`, `profileFile`, `blockedAt`
- 해제는 기존 `DELETE /api/v1/users/{userNo}/block`

---

## 2026-10-02 11:32

### API · 내 활동
- `GET /api/v1/settings/activities` — 내가 한 일만 최신순
- 종류: 게시글·댓글·답글 좋아요, 댓글, 답글, 내가 보낸 이웃 신청, 게시글, 스토리
- `snippet`은 미리보기 원문. `neighborStatus=PENDING`이면 기존 이웃 취소 API

---

## 2026-10-02 11:13

### API · 탈퇴 계정 로그인
- 이메일·휴대폰 로그인과 소셜 로그인에서 탈퇴 계정이면 `403` `ACCOUNT_WITHDRAWN`
- message는 `탈퇴된 계정입니다.`
- 비밀번호가 틀린 활성 계정은 기존 `LOGIN_FAILED`

## 2026-10-02 11:11

### DB v15 · 탈퇴 요청 시각 제거
- `ultary_user.withdrawal_requested_at` 삭제. 이 컬럼을 쓰는 API는 없었다
- 탈퇴 `DELETE /auth/me`는 그대로 `WITHDRAWN`과 `withdrawal_completed_at`
- 기존 DB: `009_drop_withdrawal_requested_at.sql`

## 2026-10-02 11:00

### 검증 · 펫 태그 형식 오류 문구
- 펫 멘션 ID(`mentionId`) 형식 오류는 `펫 태그는 영문, 숫자, 언더바(_)만 사용할 수 있습니다. (1~30자)`
- 태그 핸들 문구는 그대로 `핸들은 …`

## 2026-10-02 10:33

### API · 로컬 펫 멘션 ID 쿨다운 초기화
- `POST /api/v1/test/pets/{petId}/mention-id-cooldown` (`local` 프로필만)
- 로그인 유저 소유 펫의 `mention_id_changed_at`을 올해 1월 1일로 되돌린다
- prod에서는 컨트롤러가 없어 404

## 2026-10-02 09:49

### API · 로그인 중 비밀번호 변경
- `PUT /auth/password/me`. 이미 비밀번호가 있으면 `currentPassword`, 없으면 생략하고 `newPassword`만
- 성공하면 그 계정의 기존 토큰을 폐기

## 2026-10-02 09:44

### API · 휴대폰 인증번호 발송 때 번호 중복
- `POST /auth/phone`이 코드를 저장하기 전에 검사한다
- 회원가입은 이미 가입된 번호면 `PHONE_ALREADY_USED`
- 회원정보 변경(`purpose=PROFILE`, Bearer)은 다른 사람 번호만 거절하고 내 번호는 다시 보낼 수 있다
- 비밀번호 재설정(`purpose=PASSWORD`)은 가입된 번호로 보낸다
- 가입·회원정보 저장 때의 중복 검사는 그대로 둔다

## 2026-10-02 09:36

### API · 회원정보 수정에서 연락처 변경
- `PATCH /auth/me`에 `phone`, `phoneAuthCompleteToken`
- 기존 번호와 다를 때만 인증 완료 토큰의 번호와 맞는지 확인하고 저장

## 2026-10-02 09:12

### API · 스토리 조회에 내 공감 여부
- `GET /main/stories`, `GET /my-ultary/stories`, `POST /stories/{storyId}/view` 항목에 `likedByMe`
- 조회자가 그 스토리에 공감한 상태(소프트 삭제 제외)면 true

## 2026-10-01 10:51

### 검증 · 닉네임에 숫자 허용
- 영문·숫자·한글. 숫자는 영문과 같이 1자. 한글 1자는 2자
- 한글만 2~5, 영문·숫자만 4~10, 섞으면 가중치 합 4~10 (한글 최대 5자)
- 컬럼 길이는 그대로 `VARCHAR(30)`. 기존 DB 재실행 없음

## 2026-10-01 10:34

### API · 로컬 닉네임 쿨다운 초기화
- `POST /api/v1/test/nickname-cooldown` (`local` 프로필만). 로그인 유저의 `nickname_changed_at`을 올해 1월 1일로 되돌린다
- prod에서는 컨트롤러가 없어 404

## 2026-09-30 15:50

### DB v14 · API · 알림 목록과 발생 저장
- `GET /api/v1/notifications` 는 화면 문장(`message`), 인용 일부(`snippet`), 이동용 id, 안 읽은 수
- 같은 대상은 1행. 좋아요·스토리 공감·내 게시글의 댓글/답글은 인원만 늘리고, 댓글·답글 문구는 최신 글로 덮어씀
- 이웃 신청, 게시글·댓글·답글 좋아요, 댓글/답글 언급, 게시글·스토리 펫 태그, 스토리 공감이 생길 때 저장
- 스토리 공감 `POST/DELETE /api/v1/stories/{storyId}/like` (`ultary_story_like`)
- 웹소켓은 아직 없음

## 2026-09-30 15:00

### API · 검색에서 본인 계정 제외
- `GET /api/v1/main/search`의 `users[]`에서 로그인한 본인 `userNo`를 뺀다
- 같은 응답의 `pets[]`에서 보호자가 본인인 펫을 뺀다
- 검색 페이지(`type=USER`)와 사진 태그·스토리 `@`(`type=PET`), `type=ALL` 모두 적용

## 2026-09-30 14:31

### DB v13 · API · 사진·스토리 최근 펫 태그
- 검색창 최근 검색(`ultary_user_search_history`, 들어간 유저 울타리)과 **다른 테이블** `ultary_user_pet_tag_history`
- 한 사용자·펫당 1행. 다시 고르면 `used_at`만 갱신
- `GET /api/v1/main/pet-tags/recent` — 최근 20건. `petId`, `mentionId`, `name`, `userNo`, `ownerNickname`, `profileFile`, `usedAt`
- `POST /api/v1/main/pet-tags/recent` `{ petId }` — 스토리 `@` 또는 사진 태그에서 펫을 고를 때. 검색 최근 저장 API를 쓰지 않음
- `DELETE /api/v1/main/pet-tags/recent` — 내 최근 펫 태그 전부 삭제
- `GET /api/v1/main/search?type=PET`의 `pets[]`에 `ownerNickname` 추가. 멘션명만 맞아도 보호자 닉네임을 준다
- 기존 DB: `007_recent_pet_tag.sql`

## 2026-09-30 14:08

### DB v12 · API · 스토리 사진 위 글자·펫 멘션
- `ultary_story_text`: 내용, `font_size`(12\|16\|20\|24, 기본 16), 굵게·밑줄·취소선, `#RRGGBB`, `pos_x`/`pos_y`(0~100)
- `ultary_story_mention`: `pet_id`와 위치. 활성 펫과 1:1
- `POST /api/v1/my-ultary/stories`에 `texts`, `mentions`(각 최대 20). 스토리 조회 응답에도 포함. 멘션 응답은 `mentionId`, `petName`
- 멘션 후보: `GET /api/v1/main/search?type=PET&q=` — `mention_id`, 펫 이름, 보호자 닉네임
- 기존 DB: `006_story_overlay.sql`

## 2026-09-30 09:07

### API · 태그된 게시글은 그 울타리 주인 글 제외
- `GET /api/v1/my-ultary/tagged-feeds`는 다른 사람이 내 펫을 `COLLABORATOR`로 넣거나 사진에 `@` 멘션한 글만 반환
- 작성자가 나인 글은 게시글 그리드에만 있고 태그 탭에는 없음

## 2026-09-29 14:28

### API · 펫 프로필 사진 교체 시 이전 파일 삭제 표시
- `PATCH /api/v1/pets/{petId}`에서 `profileFileId`를 다른 파일로 바꾸거나 `removeProfileFile=true`이면, 빠지는 이전 `ultary_file`을 `is_deleted=1`, `deleted_at=NOW()`로 표시
- 그 파일이 다른 활성 펫, 피드 미디어, 스토리, 태그 이미지에 아직 연결되어 있으면 행은 유지
- 새 파일 행은 기존처럼 `POST /api/v1/files`로 만든 뒤 `profileFileId`로 연결

## 2026-09-29 11:40

### API · 다른 사람 울타리의 펫 · 게시글 목록
- `GET /api/v1/users/{userNo}/pets` — 그 유저의 펫 목록. 항목·정렬은 `GET /pets`와 같다 (`priority` 오름차순, 같으면 petId)
- `GET /api/v1/users/{userNo}/feeds` — 그 유저의 게시글 그리드. 항목·쿼리(`size`)는 `GET /my-ultary/feeds`와 같다
- `GET /pets`, `GET /my-ultary/feeds`는 계속 **로그인한 나**만 반환한다. 다른 사람 울타리에서 이 둘을 쓰면 안 된다
- 게시글 공개: `PUBLIC`은 조회 가능, `NEIGHBORS`는 ACCEPTED 이웃(또는 본인)만, `PRIVATE`는 그 `userNo` 본인만. 삭제 글은 제외
- 상대가 나를 차단했거나 내가 상대를 차단했으면 울타리 조회와 같이 `USER_BLOCKED`
- 경로의 `userNo`가 나 자신이면 각각 `GET /pets`, `GET /my-ultary/feeds`와 같은 결과

## 2026-09-29 10:33

### API · 울타리 스토리 버튼 (없음 / 안읽음 / 다 읽음)
- 대상: `GET /api/v1/my-ultary`, `GET /api/v1/users/{userNo}/ultary`
- 둘 다 `hasStory`, `hasUnviewed`를 준다. 기준은 **지금 로그인한 사람**
- `hasStory`: 그 울타리 주인의 활성 스토리가 1개라도 있으면 true. 없으면 false
- `hasUnviewed`: 그 활성 스토리 중 내가 안 읽은 것이 1개라도 있으면 true. 스토리가 없으면 false
- 버튼: `hasStory=false` → 없음. `hasStory=true && hasUnviewed=true` → 안읽음. `hasStory=true && hasUnviewed=false` → 다 읽음
- 내 울타리도 같다. 내가 내 스토리를 봤는지로 안읽음/다 읽음을 가른다
- `POST /api/v1/stories/{storyId}/view`는 **본인 스토리도** `ultary_story_view`에 기록한다 (`INSERT IGNORE`). 기록하지 않으면 내 버튼이 다 읽음이 될 수 없다
- `GET /my-ultary/stories` · `GET /main/stories`의 `viewedByMe`도 본인 스토리에 같은 기록을 반영한다

## 2026-09-29 09:50

### schema v11 · 프로필 사진은 대표 펫
- `ultary_user.profile_file_id` 제거. 유저 전용 프로필 사진 없음
- `ultary_pet.priority` 추가. 작을수록 우선, 1이 가장 높음
- 화면의 유저 프로필 사진 = 활성 펫 중 `profile_file_id`가 있는 것 가운데 priority가 가장 높은 펫. 같으면 `pet_id`가 작은 쪽. 없으면 null
- 펫 목록(`GET /pets`)은 priority 오름차순, 그다음 petId
- 등록 시 priority 생략하면 맨 뒤. 수정은 `PATCH /pets/{petId}` `{ priority }`
- `PATCH /my-ultary/profile-image` 제거. 사진은 펫 `profileFileId`로 바꿈
- 기존 DB: `005_pet_priority_profile.sql`

## 2026-09-29 09:32

### API · 최근 검색 모두 지우기
- `DELETE /api/v1/main/search/recent` — 내 최근 검색 행 전부 삭제
- 목록에서 빠진 탈퇴·차단 대상도 함께 지움. 응답 data는 null

## 2026-09-29 09:14

### API · 최근 검색 (들어간 유저 울타리)
- `GET /api/v1/main/search/recent` — 검색창을 열면 5건. `nextCursorHistoryId`
- `GET /api/v1/main/search/recent/more?cursorHistoryId=` — 더보기 20건
- `POST /api/v1/main/search/recent` `{ targetUserNo }` — 그 울타리에 들어갈 때 저장. 재방문은 `searched_at` 갱신
- 항목: `userNo`, `nickname`, `profileFile`(없으면 null)

## 2026-09-29 09:11

### schema v10 · 최근 검색은 유저 울타리만
- `ultary_user_search_history`에서 `search_type`, `target_pet_id`, `target_tag_id`, `keyword` 제거
- 남기는 것: 누가(`user_no`) 누구 울타리(`target_user_no`)에 들어갔는지, `searched_at`
- 같은 쌍은 1행. 다시 들어가면 `searched_at`만 갱신
- 기존 DB: `004_search_history_user_only.sql`

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

## 2026-10-21

- 공유 대상에 펫 태그와 닉네임·펫 태그 서버 검색을 추가하고 최근 DM·양방향 스토리/피드 태그·팔로우/팔로워의 9단계 우선순위를 적용했다. 앞 3단계 순서 지정과 공통 AccountSearchList 컴포넌트를 지원한다.

- 스토리 언급·피드 사진 언급·DM 대상 선택을 같은 AccountSearchList UI로 통일하고 각 모드의 첫 우선순위를 적용했다. 개별 펫 선택·본인 펫 검색을 지원하고 취소 버튼 및 DM의 팔로우/팔로워 탭을 제거했다.
