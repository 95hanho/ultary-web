# Ultary Web

반려동물 SNS Ultary의 Next.js 웹 클라이언트 (BFF 포함).

## 문서

- [BFF 개요](docs/bff/README.md) — 아키텍처, API 명세, 구현 가이드
- [API 메모](share/docs/api-memo.md) — 엔드포인트 SoT (FE ↔ BE 공유, `share/`)
- [공유 스펙](share/README.md) — validation · database · 계약

## 개발

```bash
npm install
cp .env.example .env               # 공통 OAuth 등 값 채우기
cp .env.local.example .env.local   # 로컬 주소·BE local과 같은 BFF 키
npm run dev
```

`http://localhost:3000`

환경 파일은 `.env`, `.env.local`, `.env.production`과 각각의 `.example` 총 6개다. 실제 설정 3개는 Git 제외, 예제 3개만 공유한다. 공통 OAuth 설정은 `.env`, 환경별 URL과 BFF 키는 `.env.local`/`.env.production`에 둔다.

운영은 `.env.production.example`을 `.env.production`으로 복사해 HTTPS/WSS 주소와 BE prod의 BFF 키를 채운 후 `npm run build`, `npm start`로 실행한다. 운영 서버에는 로컬 설정 파일을 배포하지 않는다.

Next 기본 로딩은 `.env.local`이 `.env.production`보다 우선한다. 이를 피하기 위해 npm 스크립트가 `scripts/run-next.mjs`에서 Node의 `loadEnvFile()`로 환경 파일을 읽은 후 Next를 실행한다. 우선순위는 **서버 환경변수 → 선택한 환경 파일 → 공통 `.env`** 순이다. 따라서 개발/운영 모두 **위 npm 스크립트로 실행**한다. `.example`은 자동으로 읽지 않는다. `--env-file` 실행 옵션은 Next 하위 프로세스의 `NODE_OPTIONS`와 충돌하므로 사용하지 않는다.
