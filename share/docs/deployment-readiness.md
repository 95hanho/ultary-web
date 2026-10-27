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
| BE WAR | bootWar 성공, ultary.war 내부 구성 검사 완료 |

- Gemini 실제 호출·로그인된 브라우저 흐름·실서버 배포는 이번 점검에 포함하지 않았다. 배포된 FE와 운영 BE 간 연동은 아직 확인하지 않았다.
- FE 운영 origin은 https://ultary-web.vercel.app으로 확정했다. 로컬 .env.production 및 예제에 반영했고 기존 OAuth 키를 운영 파일에 복사했다. Vercel 환경변수는 별도 등록·재배포가 필요하다.
- WAR SHA-256: d9cad6e56d26f2f63f2cb3620d0ff31875e85fb517ae7ea6bbff849d387fb43a
- WAR 크기: 36060436 bytes. 빌드 산출물은 Git 제외다.

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
5. BE 실제 서버 Java 17·Jakarta 호환 Tomcat, ultary.war의 /ultary 컨텍스트와 외부 URL/프록시 매핑, 환경변수·HTTPS/WSS·영속 업로드 경로/권한을 확인한다. 사용자 결정상 기존 DB를 유지한다. 정리 전 백업과 실제 서버 연결을 재확인한다.
6. 이전 배포본·운영 DB·업로드 백업과 되돌리기 경로를 확보한 다음 명시적 배포 요청을 받아 교체한다. 기존 DB에 init/seed를 실행하지 않는다. v38 적용 DB에 migration을 중복 실행하지 않는다. 과거 일회성 데이터 복구는 재실행하지 않는다.
7. 배포 후 짧은 핵심 흐름 점검(로그인/계정 전환/업로드/실제 Gemini/DM 실시간/관리자 삭제·복구/작성자 알림 링크)과 PC·모바일·HTTPS/WSS 확인.
8. 오래된 타입/목업 fallback/문서 일괄 정리는 마지막 단계다. 사용 중인 mock 유틸은 무조건 삭제하지 않는다. SMS 실발송/스토리 만료 복원은 현재 데모 정책상 보류다.

Vercel FE 최초 배포는 Ready 확인(사용자 화면). 운영 FE 주소는 https://ultary-web.vercel.app. BE 배포·HTTPS/WSS·환경변수·업로드 제한 대응 및 통합 연결 확인은 남아 있다.

## 운영 주소 확정 (2026-10-26)

- FE: https://ultary-web.vercel.app. 배포별 임시 URL은 canonical/OAuth 기준으로 사용하지 않는다.
- BE 예정: https://95hanho.pe.kr/ultary, WS 예정: wss://95hanho.pe.kr/ultary/api/v1/ws. 실제 HTTPS 포트/컨텍스트는 Cafe24에서 확인 필요.
- Google callback: https://ultary-web.vercel.app/api/auth/social/google/callback
- Kakao callback: https://ultary-web.vercel.app/api/auth/social/kakao/callback
- BE prod 실제 파일/패키징 템플릿의 WS_ALLOWED_ORIGINS 기본값에 FE origin을 반영했다. 서버 환경변수로 재정의 가능하다.
- 로컬 비밀 env/yml은 Git/WAR에 포함하지 않는다. Cafe24에서는 prod 템플릿의 DB/JWT/BFF/Gemini/UPLOAD_DIR 환경변수와 PHONE_AUTH_DEMO_MODE=true를 따로 설정해야 한다.
- Vercel 업로드는 현재 BFF 경유이므로 4.5MB 요청 제한 대응이 필요하다. FE 배포 성공만으로 파일 업로드/DM/OAuth 연동 완료를 의미하지 않는다.

- 주소 반영 후 FE 운영 빌드·SEO/env 회귀 15개 통과. 로컬 운영 실행의 /login에서 production canonical·OG 이미지 절대 주소·index 확인, /robots.txt에서 production sitemap origin 확인. BE ultary.war 재생성 및 prod Origin/환경변수 템플릿·local YAML 제외 확인. 운영 BE가 연결되기 전이므로 실제 공개 콘텐츠 sitemap 응답/검색 엔진 색인 완료는 미검증이다.

## WAR YAML 인코딩 오류 수정 (2026-10-26)

- Cafe24 13:45 배포에서 YAML MalformedInputException으로 Spring 시작 실패. 원본 UTF-8은 정상이지만 Windows WAR CopySpec 필터가 기본 charset으로 설정을 변환한 것을 재현했다.
- bootWar.filteringCharset=UTF-8을 명시하고 생성 후 두 YAML의 엄격 UTF-8 검증을 추가했다. clean bootWar 및 재검증 통과. 새 WAR의 설정/한글 주석이 원본과 일치하고 prod 기본값/local 설정 제외를 확인했다.
- 기존 /bapi/nextjs_shop 및 과거 잘못된 Host 헤더 요청 로그와 구분한다. Cafe24에서 새 ultary.war 재배포 후 실제 Started 로그 및 환경변수·HTTPS/BFF/DB 점검이 필요하다.

## Cafe24 HTTPS 프록시 진단 (2026-10-26)

- 시작 오류가 UPLOAD_DIR 누락으로 변경돼 로컬 기존 DB/JWT/BFF/Gemini 값을 채운 비공개 build/deploy/setenv.sh를 생성했다. Git 제외/LF/셸 문법 확인. UPLOAD_DIR 기본 준비값은 $HOME/files/ultary이며 기존 파일 위치가 있으면 맞춰야 한다.
- 이후 health/db가 Spring JSON HTTPS_REQUIRED를 반환했다. Cafe24는 앞단 nginx에서 TLS를 종료하는 구조다. 실제 연결 peer와 X-Forwarded-Proto 전달/덮어쓰기 정책 확인 후 BFF_TRUSTED_PROXIES를 한정해야 한다. 임의 IP 추측·전체 인터넷 신뢰·HTTPS 검사 해제는 적용하지 않았다.
- health/db HTTPS 거절 시 시작당 한 번 remoteAddr/scheme/secure, forwardedProto 개수/https 일치 여부, 신뢰 프록시 개수만 진단 로그에 기록한다. 키/토큰/원문 헤더는 기록하지 않는다. BFF 필터 13개 테스트 및 WAR 빌드 통과. 서버 재배포 후 진단 로그 확인 필요.

## 현재 Cafe24 HTTPS 정책 — 앞선 프록시 진단보다 우선 (2026-10-26)

- 사용자 승인으로 prod 템플릿과 로컬 prod의 security.bff.require-https를 false로 설정했다. Cafe24 nginx의 HTTPS 처리를 사용하고 BE의 원본 프로토콜 검사만 생략한다. BFF 키 검증·FE 운영 HTTPS URL 제한·브라우저 WSS 요구는 유지한다.
- 진단값: remoteAddr=203.245.44.21, scheme=http, secure=false, X-Forwarded-Proto 없음. BFF_TRUSTED_PROXIES 추가나 호스팅 문의는 현재 배포의 선행 조건이 아니다.
- BFF 필터 13개 테스트와 bootWar 통과, WAR의 false 설정/키 환경변수 바인딩 유지 확인. 서버 새 WAR 배포 후 health/db 및 FE 연동 확인 필요.

## 현재 실시간 운영 정책 (2026-10-27)

현재 Cafe24 JSP 배포에서는 웹소켓을 사용하지 않는다. FE 운영 기본 비활성화, 로컬 npm run dev 기본 활성화. 상세 제약·시연·환경변수는 [실시간 배포 문서](./realtime-deployment.md)를 따른다. 이전 WSS/Origin 확인 항목은 향후 웹소켓 지원 호스팅으로 이전할 때 적용한다.
