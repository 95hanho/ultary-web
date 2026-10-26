# 배포 준비 점검 — 2026-10-26

## 전달 상태와 변경 비교

- 확인 시작 커밋: BE cffc28f, FE 95dcdc8. 두 커밋은 원격 main과 일치했다. 추적 파일 누락/미추적 전달 파일 없음, share 64개 파일의 상대 경로/해시 모두 일치했다.
- 주요 사용자 흐름 통합 검증은 사용자 확인으로 완료됐다. 전체 흐름을 처음부터 재실행하지 않았다.
- 10월 23일 이 채팅 이후 관리자 테이블/요청별 AI 오류 묶음·우선순위/시도 이력/대상 미리보기, AI 삭제 복구, 모달 없는 작성자 결과 알림·대상 링크, 로그인·로그아웃 계정 캐시 초기화, 가입 완료 안내, DM 숨김·복원이 추가됐다.
- 최신 정책을 유지했다. 특히 AI 삭제조치→유지/확인 대기 복구와 결과 알림 비모달 처리는 과거 인계의 ‘삭제는 최종’/‘모달 표시’보다 우선한다. 작성 중 AI_CONTENT_BLOCKED 모달은 유지한다.
- 읽기용 HOME_HANDOFF.md 및 DEPLOY_HANDOFF.md는 양쪽 저장소에서 제거했다. 테스트/migration/영구 기능 문서는 유지한다.

## 이번 실행 결과

| 검사 | 결과 |
|---|---|
| FE 회귀 | 7개 스크립트 137개 통과 (SEO 포함) |
| BE 전체 회귀 | 157개 통과. 구정책 테스트 2개를 동기 게시글 검사·방향성 차단 정책에 맞게 수정, DB fixture 롤백 |
| DB | BE local과 MCP가 같은 DB. v38 inspection_content 컬럼 확인. 운영 DB 연결은 별도 확인 필요 |
| BFF 키 | 현재 로컬 설정 및 운영 설정 파일의 양쪽 키 일치 확인. 실제 배포 환경 주입은 별도 |
| FE 타입 | 통과. 이전 [requestId] 경로를 참조한 생성 타입 캐시만 제거/재생성 |
| FE 전체 lint | 통과: 0 errors/0 warnings. 규칙 비활성화 없이 수정, --max-warnings=0 확인 |
| FE 운영 빌드 | npm run build 성공 |
| FE 운영 실행 | npm start -- --port 3001로 확인 후 서버 종료 |
| HTTP 점검 | /login·/signup 200, 비로그인 /dm·/settings 307→/login, /api/auth/me 401 |
| BE WAR | bootWar 성공, ROOT.war 내부 구성 검사 완료 |

- Gemini 실제 호출·로그인된 브라우저 흐름·실서버 배포는 이번 점검에 포함하지 않았다. 도메인이 미정이므로 로컬 실행 검증이며 운영 도메인 동작 확인이 아니다.
- 실제 FE .env.production의 APP_URL/NEXT_PUBLIC_APP_URL은 아직 비어 있다. 서버 env 처리에서 빈 문자열도 미설정으로 간주하도록 수정해 로컬 빌드를 허용했다. 최종 배포에는 실제 주소가 필수다.
- WAR SHA-256: e5efe1013302a0fb2bc34093f37e5bd7682079ec8bd3cec826637b864cf32994
- WAR 크기: 36059726 bytes. 빌드 산출물은 Git 제외다.

## 배포 WAR의 설정 방식 (변경됨)

- bootRun/테스트는 기존 실제 application*.yml을 계속 사용한다.
- bootWar는 로컬/실제 비밀 설정을 패키징하지 않고 config-samples의 application.yml·application-prod.yml만 WEB-INF/classes에 넣는다. 기본 profile은 prod다. application-local.yml과 config-samples 폴더는 WAR에서 제외한다. 매퍼 23개와 실행/ServletInitializer 클래스는 유지한다.
- 실제 설정은 서버 환경변수로 주입한다. 필수: DB_URL, DB_USERNAME, DB_PASSWORD, UPLOAD_DIR, BFF_INTERNAL_KEY, JWT_USER_SECRET, JWT_REFRESH_SECRET, JWT_ADMIN_SECRET, JWT_PHONEAUTH_SECRET, JWT_PHONEAUTH_COMPLETE_SECRET, JWT_PWDCHANGE_SECRET, WS_ALLOWED_ORIGINS.
- 게시글 검사/추천을 사용하려면 GEMINI_API_KEY도 필요하다. 기존 model/base-url/timeout/low thinking은 유지한다.
- WS_ALLOWED_ORIGINS에는 확정한 FE origin을 넣는다. TLS 종료 프록시가 있다면 BFF_TRUSTED_PROXIES에는 실제 신뢰 프록시만 지정한다.
- 데모 정책을 운영에도 적용할 때 PHONE_AUTH_DEMO_MODE=true를 명시한다. 기본값 false이며 실제 SMS 발송은 구현하지 않았다. 테스트 컨트롤러는 local profile 전용, FE 개발 도크는 development 전용이다.
- 서버 환경에서 prod profile을 사용해야 한다. 기존 actual application-prod.yml을 WAR에 넣는 방식에 의존하지 않는다. JWT 키를 바꾸면 기존 토큰이 무효화되므로 운영 키를 임의로 새로 만들지 않는다.

## SEO 후속 완료 (2026-10-26)

사용자 결정에 따라 로그인·공개 울타리·공유 피드만 검색 노출하도록 구현했다. canonical/OG/Twitter/robots/sitemap과 공개 목록 API를 추가했다. 도메인 미정에서는 색인을 차단한다. 상세 및 검증은 [seo.md](./seo.md).

## 실제 배포 전 남은 항목 (우선순위)

1. SEO 구현은 완료. 운영 도메인을 넣은 뒤 실제 canonical/OG/robots/sitemap 확인과 검색 엔진 등록이 남아 있다.
2. 노출 정책은 결정 완료: 로그인·공개 울타리·공유 피드만 노출. 메인 / 는 비로그인 시 로그인으로 이동하는 동작을 유지한다.
3. 전체 lint 정리 완료. props 변경 시 상태 초기화·이벤트에서 사용하는 ref·hydration 처리를 수정했다. 137개 회귀와 운영 빌드 통과, 브라우저에서 댓글 닫기/재열기·사진 변경 후 크롭 저장 확인.
4. FE 호스팅/실제 HTTPS 도메인 확정 후 APP_URL·NEXT_PUBLIC_APP_URL·SPRING_BASE_URL·NEXT_PUBLIC_SPRING_WS_URL, OAuth 공급자의 callback/허용 도메인을 맞추고 다시 빌드한다. NEXT_PUBLIC_*는 빌드 시 반영된다.
5. BE 실제 서버 Java 17·Jakarta 호환 Tomcat, ROOT.war 컨텍스트와 현재 /ultary URL/프록시 매핑, 환경변수·HTTPS/WSS·영속 업로드 경로/권한을 확인한다. 운영 DB는 테스트 DB와 구분해 연결을 재확인한다.
6. 이전 배포본·운영 DB·업로드 백업과 되돌리기 경로를 확보한 다음 명시적 배포 요청을 받아 교체한다. 기존 DB에 init/seed를 실행하지 않는다. v38 적용 DB에 migration을 중복 실행하지 않는다. 과거 일회성 데이터 복구는 재실행하지 않는다.
7. 배포 후 짧은 핵심 흐름 점검(로그인/계정 전환/업로드/실제 Gemini/DM 실시간/관리자 삭제·복구/작성자 알림 링크)과 PC·모바일·HTTPS/WSS 확인.
8. 오래된 타입/목업 fallback/문서 일괄 정리는 마지막 단계다. 사용 중인 mock 유틸은 무조건 삭제하지 않는다. SMS 실발송/스토리 만료 복원은 현재 데모 정책상 보류다.

실제 서버에는 아직 배포하지 않았다. 운영 도메인·운영 DB·환경변수가 확정되기 전이므로 이 산출물을 즉시 배포 완료 상태로 간주하지 않는다.
