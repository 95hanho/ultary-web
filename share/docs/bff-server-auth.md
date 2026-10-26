# BFF 서버 인증과 환경별 HTTPS 정책

2026-10-21 적용. DB 스키마 변경 없음.

## 요청 흐름

브라우저 → Next BFF → Spring REST API. `X-BFF-Key`는 마지막 구간에서만 사용한다. 사용자 JWT 인증은 별도로 유지하며 키가 사용자 권한을 대신하지 않는다.

- local/prod 모두 `/api/v1` 및 `/api/v1/**`에 **BFF 공유 키 필수**. 로그인·소셜 로그인·회원가입·health·공유 피드 조회처럼 사용자 JWT가 필요 없는 API도 키 검사를 통과해야 한다.
- BFF는 일반 API·재발급·파일 스트리밍에 서버 키를 추가한다. 들어온 동일 이름의 헤더는 서버 값으로 덮어쓴다. Spring은 중복 헤더를 거부하고 상수 시간 비교를 사용한다.
- 키가 없거나 다르면 Spring은 `403 BFF_UNAUTHORIZED`로 컨트롤러 이전에 거부한다. 설정 키가 없거나 32자 미만이면 Spring 시작/Next 요청이 실패하며 인증을 우회하지 않는다.
- BFF는 고정된 Spring 오리진의 상대 API 경로만 허용하고, 업스트림 리다이렉트를 따라가지 않는다. 다른 URL로 키가 전달되지 않게 한다.

## 환경별 설정

| 환경 | FE 서버 전용 파일 | BE 실제 파일 | 통신 |
|---|---|---|---|
| local | `.env.local`의 `BFF_INTERNAL_KEY` | `src/main/resources/application-local.yml`의 `security.bff.shared-key` | HTTP 허용, 키 검사 필수 |
| prod | `.env.production` 또는 배포 환경변수 `BFF_INTERNAL_KEY` | `application-prod.yml`의 같은 속성 | HTTPS 필수, 키 검사 필수 |

환경마다 독립적인 암호학적 난수 32바이트(64자리 hex)를 생성했다. 각 환경의 FE/BE 값은 같고 local과 prod 값은 다르다. 실제 파일은 Git 제외 대상이다. 키 자체는 문서·example·sample·요청 예제·로그에 기록하지 않는다.

BE 실제 yml은 `${BFF_INTERNAL_KEY:생성된비공개값}`으로 환경변수 재정의도 허용한다. 공유 sample은 `${BFF_INTERNAL_KEY:}`로 비워 두었다. FE example의 `BFF_INTERNAL_KEY=`도 빈값이다. Next 변수에 `NEXT_PUBLIC_`을 붙이지 않는다. `env.server.ts`와 요청 준비 모듈에 `server-only`를 적용했다.

FE 환경 파일은 `.env`, `.env.local`, `.env.production` 및 각각의 `.example` 총 6개다. 공통 OAuth 설정은 `.env`, 환경별 URL과 BFF 키는 `.env.local`/`.env.production`에 둔다. 실제 파일 3개는 Git 제외, 예제 3개는 비밀값 없이 공유한다.

`npm run dev`는 `.env` → `.env.local`, `npm run build`와 `npm start`는 `.env` → `.env.production`을 Node `--env-file`로 먼저 읽는다. Next 기본 우선순위에서 `.env.local`이 운영 설정을 덮어쓰는 것을 막기 위해 npm 스크립트로 실행한다. 이미 설정된 프로세스 환경변수가 최우선이다. 운영 배포에는 `.env.local`을 포함하지 않는다.

### 프로덕션 주소와 프록시

프로덕션 키는 로컬 비공개 설정에 준비했으며 실제 운영 서버에 배포/업로드하지 않았다. 배포할 때 다음 값은 운영 환경에 맞게 설정한다.

1. `.env.production`의 `NEXT_PUBLIC_APP_URL`, `APP_URL`, `SPRING_BASE_URL`은 **실제 HTTPS URL**, `NEXT_PUBLIC_SPRING_WS_URL`은 실제 WSS URL로 채운다. 현재 운영 주소 항목은 빈칸이며 `.env.production.example`에 형식 예시가 있다. HTTP Spring 주소는 실제 요청 전에 거부된다.
2. 현재 Cafe24 운영 설정은 `security.bff.require-https=false`다(2026-10-26 사용자 결정). 앞단 nginx가 TLS를 종료하고 원본 프로토콜 헤더 없이 Tomcat에 HTTP로 전달하므로 BE의 별도 원본 HTTPS 검사는 적용하지 않는다. BFF 키 검증은 유지하고 Next 운영 요청은 계속 HTTPS만 허용한다. BE는 유효한 키가 있는 HTTP 요청도 허용한다.
3. 다른 호스팅에서 `require-https=true`로 설정할 경우: BE가 직접 TLS를 처리하면 `request.isSecure()`로 확인한다. 프록시가 TLS를 종료하는 경우 `BFF_TRUSTED_PROXIES`에 **실제 연결 peer 프록시 IP/CIDR만** 지정한다. 기본은 비어 있어 전달 헤더를 신뢰하지 않는다.
4. 프록시는 외부의 `X-Forwarded-Proto`를 덮어쓰고 실제 원본 프로토콜 한 개만 전달해야 한다. 지정한 프록시의 단일 `https` 값만 인정하며, 임의 외부 peer의 `Forwarded`/`X-Forwarded-Proto`는 인정하지 않는다. 신뢰 범위를 전체 인터넷으로 설정하지 않는다.
5. prod sample/실제 yml의 `server.forward-headers-strategy=none`은 애플리케이션이 검증 전 전달 헤더로 보안 연결을 오인하지 않게 한다. 외장 Tomcat의 별도 RemoteIpValve 등은 호스팅 관리 설정에서도 신뢰 프록시가 올바른지 확인해야 한다.

환경 파일 변경은 실행 중인 FE/BE의 재시작 후 확실하게 반영된다. 프로덕션 키는 local 키와 독립적으로 교체한다.

## WebSocket과 정적 파일

- 기존 브라우저→Spring `GET /api/v1/ws` WebSocket Upgrade는 **키를 브라우저로 전달하지 않는다.** 허용 Origin 검사 및 연결 후 일회용 티켓 인증을 유지한다.
- `/api/v1/ws/ticket` 등 REST 티켓 발급은 BFF 키 + 사용자 JWT가 모두 필요하다. 일반 GET이나 유사 하위 경로를 키 검사 예외로 두지 않는다.
- prod 소켓도 TLS 조건을 통과해야 하며 Next 클라이언트는 `wss://`가 아니면 티켓을 요청하기 전 연결을 중단한다. 배포 시 `NEXT_PUBLIC_SPRING_WS_URL`을 실제 WSS 주소로 설정한다.
- `/uploads/**` 등 기존 공개 정적 경로는 이번 REST API 키 검사 범위 밖이다. CDN 파일에는 키를 전달하지 않는다.

## 개발 요청과 검증

- `requests/*.http`는 `X-BFF-Key: {{bffKey}}`와 `{{$processEnv BFF_INTERNAL_KEY}}` 변수를 사용한다. REST Client를 실행하는 로컬 환경에 로컬 키를 설정하며, 추적 중인 `.http` 파일에 실제 값을 붙여 넣어 커밋하지 않는다.
- 브라우저와 FE의 BFF 호출에는 별도 키 입력이 필요 없다. BFF 서버가 자동으로 보낸다.
- BE: 필터 단위 테스트 13개, 보안 체인 통합 테스트 3개, 기존 인증·관리자·재발급 테스트 19개 통과.
- FE: 인증 테스트 37개, TypeScript 통과. 파일 스트리밍, 키 누락·HTTP 프로덕션 차단·리다이렉트 방지·WSS 제한 포함. 변경 파일 ESLint 오류 없음(기존 NodeJS 타입 선언 경고 유지).
- 실제 키 파일의 환경별 일치·Git 제외·추적 파일 노출 여부를 값 출력 없이 검사한다. 운영 호스팅의 TLS/프록시 연결을 실제로 시험한 것은 아니다.
