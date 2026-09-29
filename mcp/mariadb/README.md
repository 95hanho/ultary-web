# MariaDB MCP (Cafe24 / HeidiSQL)

에이전트가 HeidiSQL과 같은 DB에 붙어 스키마·조회를 할 수 있게 한다.

## 1. env 채우기

```text
mcp/mariadb/.env.example  →  mcp/mariadb/.env  (이미 .env 있으면 그 파일만 수정)
```

`MYSQL_HOST` / `USER` / `PASSWORD` / `DATABASE` 만 HeidiSQL과 동일하게 입력.

## 2. Cursor에서 할 일 (Figma와 비교)

| | Figma MCP | MariaDB MCP |
|--|-----------|-------------|
| 로그인(OAuth) | 있음 (Connect / 권한 허용) | **없음** |
| 설정 | MCP 켜기 | 동일: **Settings → MCP** 에서 `mariadb` **Enable** |
| 도구 실행 | 승인 팝업 | 동일: 에이전트가 도구 쓸 때 **Allow** (또는 Auto-review) |

Figma처럼 웹 계정 연동 버튼은 없고, **MCP 서버 ON + (필요할 때) 도구 승인**이면 된다.

## 3. 확인

1. Cursor 재시작 또는 MCP 패널에서 `mariadb` 서버 새로고침
2. 상태가 초록/연결됨인지 확인
3. 채팅에서 «DB 테이블 목록 보여줘» 등으로 테스트

## 주의

- 운영 DB면 **조회 전용 계정** 권장
- `.env` 는 git 제외 (비밀번호)
- Node.js / `npx` 필요
