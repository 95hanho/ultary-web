# share — FE / BFF / Spring 공통

이 폴더가 **공유 스펙의 최신본(SoT)** 이다.  
ultary-web · ultary-api 모두 여기 내용을 미러링한다. 규칙이 바뀌면 **먼저 여기 수정 → 각 레포 반영**.

변경 기록: [`CHANGELOG.md`](./CHANGELOG.md)

```
share/
  README.md
  CHANGELOG.md              ← 변경 기록 (validation·DB·docs 통합)
  validation/               ← 입력 검사 (닉네임·비번·폰 등)
    README.md
    rules.json
  database/
    schema/mariadb_10_1/    ← 001_init_schema.sql (schema_version 7)
    seed/mariadb_10_1/      ← 001_dev_sample_data.sql (로컬 전용)
  docs/
    api-memo.md             ← 엔드포인트·도메인 메모
    API_CONTRACT.md         ← 응답·계약 요약
```

| 경로 | 용도 |
|------|------|
| `validation/` | 회원가입·로그인·식별자 입력 검사. BFF/FE 미러링 |
| `database/schema/` | MariaDB 스키마 |
| `database/seed/` | 로컬 전용 시드 (운영 제외) |
| `docs/api-memo.md` | 엔드포인트·도메인 메모 |
| `docs/API_CONTRACT.md` | 계약 요약 |

경로·시각 폴더로 버전 나누지 않는다. git 히스토리 + `CHANGELOG.md`(날짜·시분)가 버전이다.

### 이 레포(ultary-web) 문서 구분

| 위치 | 범위 |
|------|------|
| `share/` | FE ↔ Spring **공유** (api-memo, 계약, validation, schema/seed) |
| `docs/bff/` | **web 전용** BFF 가이드 (architecture, api-spec, development) |

루트 `docs/api-memo.md` · `database/` 는 두지 않는다.
