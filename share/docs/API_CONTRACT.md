# Ultary API Contract

## Source of truth

공통 스펙의 최신본은 **`share/`** 이다.

| 경로 | 내용 |
|------|------|
| `share/docs/api-memo.md` | 엔드포인트·도메인 메모 |
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

## 스켈레톤

아직 로직·DB가 없는 API는 `ErrorCode.NOT_IMPLEMENTED` (HTTP 501) 을 반환한다.
로그인/refresh/logout/me, health 등 이미 구현된 API는 예외.
