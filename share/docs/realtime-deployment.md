# 실시간 기능 구현 및 운영 환경 제약

## 포트폴리오 설명

ULTARY는 Spring WebSocket과 일회용 인증 티켓으로 DM 수신, 읽음 상태, 입력 중 표시, 알림 개수 및 AI 검수 결과 이벤트를 전달하도록 구현했습니다. 로컬 FE·BE 환경에서 실시간 기능을 시연할 수 있습니다.

현재 공개 데모는 Vercel(FE)과 Cafe24 Tomcat JSP 호스팅(BE)을 사용합니다. 사용자 확인에 따른 현재 호스팅의 웹소켓 미지원 제약으로, 공개 데모에서는 실시간 연결을 비활성화했습니다. 애플리케이션의 HTTP API 기능과 실시간 전달 계층을 구분해 운영 환경에 맞게 활성화 여부를 설정합니다.

2026-10-27 운영 주소 진단에서 웹소켓 핸드셰이크는 403 BFF_UNAUTHORIZED를 반환했고, 서버 전용 인증 통과 후에는 400 Can "Upgrade" only to "WebSocket"을 반환했습니다. 이는 Spring까지 Upgrade가 정상 전달되지 않는 상황과 일치합니다. 모든 Cafe24 상품의 일반적 제약으로 단정하지 않고, 현재 배포 환경의 제약으로 기록합니다.

## 공개 데모에서 가능한 기능과 제한

| 기능 | 공개 데모 |
|---|---|
| DM 전송·목록·대화 이력 조회 | HTTP API로 사용 가능 |
| 상대 새 메시지·읽음 상태 즉시 반영 | 실시간 반영 안 됨. 대화방 재진입/새로고침 시 조회 |
| 상대 입력 중 표시 | 사용하지 않음 |
| 알림 목록·읽음 처리 | HTTP API로 사용 가능 |
| 새 알림 개수 | 실시간 반영 안 됨. 기존 조회 시점에 갱신 |
| AI 비동기 검수 | 서버 작업 유지. 숨김/복구 이벤트의 즉시 화면 반영만 미사용, 재조회 시 반영 |

자동 폴링은 추가하지 않았습니다. 대화방 보는 중 상태의 기존 HTTP 요청은 서버 읽음 처리에 필요하므로 유지합니다.

## 설정과 시연

- 로컬 FE .env.local: NEXT_PUBLIC_ENABLE_WEBSOCKET=true, SPRING_BASE_URL=http://localhost:9377, NEXT_PUBLIC_SPRING_WS_URL=ws://localhost:9377/api/v1/ws. 로컬 BE와 FE npm run dev를 함께 실행합니다.
- 운영 FE .env.production 및 Vercel: NEXT_PUBLIC_ENABLE_WEBSOCKET=false. 개발 모드 기본값은 활성화, 운영 빌드 기본값은 비활성화입니다. false인 경우 티켓 발급·웹소켓 연결·재접속·입력 중 전송을 시도하지 않습니다.
- NEXT_PUBLIC_ 값은 빌드 시 브라우저 번들에 반영됩니다. 값을 변경하면 다시 빌드/배포하고, 로컬 npm start도 재시작합니다.
- npm run build / npm start는 운영 설정이므로 로컬 컴퓨터에서 실행하더라도 기본 비활성화입니다. 개발 환경 시연은 npm run dev를 사용합니다.
- BE WebSocket/일회용 티켓 구현은 유지하며, 이번 변경 때문에 WAR 재배포는 필요하지 않습니다. BFF 키를 브라우저로 공개하거나 인증 검사를 제거하지 않습니다.
- 향후 WebSocket을 지원하는 호스팅으로 이전하면 WSS URL·Origin·프록시 Upgrade 지원을 확인하고 명시적으로 true로 변경하여 재배포할 수 있습니다.
