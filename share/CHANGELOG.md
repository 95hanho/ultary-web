# share CHANGELOG

FE / BFF / Spring 공통 스펙(`share/`) 변경 기록.  
validation · database · docs 모두 **여기 한곳**에 적는다.

형식: `## YYYY-MM-DD HH:mm` (하루 여러 번이면 시·분 단위로 항목을 나눈다)

---

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
