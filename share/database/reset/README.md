# database/reset — Cafe24 테스트 DB 복원

외주/채용 담당자가 **현재 확정된 Cafe24 테스트 데이터**로 Ultary DB를 되돌릴 때 쓴다.

| 파일 | 내용 |
|------|------|
| `001_cafe24_ultary_restore.sql` | `ultary_*` 45개 테이블 DROP/CREATE + INSERT (mysqldump 스타일). ~460KB |

스냅샷 기준: **2026-11-06** / MariaDB **10.1.13** / 스키마 **v44** (`044_user_previous_nickname.sql`까지 반영된 라이브 구조).

## 전제

- 대상은 **Ultary 전용 DB**(또는 Cafe24처럼 같은 스키마에 다른 앱 테이블이 있어도 `ultary_*`만 건드림).
- **이 SQL만으로 충분**하다. 별도 `schema/mariadb_10_1/*.sql` 마이그레이션을 먼저 돌릴 필요 없음(덤프가 CREATE를 포함).
- 이미 마이그레이션만 적용한 빈 DB에도 그대로 실행 가능(기존 `ultary_*`는 DROP 후 재생성).

## 적용 방법

```bash
# 예: 로컬/전용 DB
mysql -h <host> -P 3306 -u <user> -p <database> < 001_cafe24_ultary_restore.sql
```

Windows (PowerShell)에서도 동일하게 리다이렉트하거나 MySQL Workbench에서 파일 실행.

## 경고

- **데이터 삭제**: 대상 DB의 모든 `ultary_*` 테이블을 DROP 후 스냅샷으로 다시 만든다. 되돌릴 수 없다.
- Cafe24 공유 DB에서 실행해도 `nextjs_shop_*` 등 **다른 앱 테이블은 변경하지 않는다**. 다만 Ultary 데이터는 전부 덮어쓴다.
- `ultary_token`은 비어 있다 → 복원 후 **다시 로그인**해야 한다.
- `ultary_user_social`도 비어 있다 → SNS 연동은 없음(실제 OAuth만).
- 테스트 계정 비밀번호 해시/`{noop}` 관리자 비번은 포함된다. **운영 시크릿·실서비스 전용 키는 넣지 않았다.**

## 스모크 로그인 (참고)

시연용으로 쓰던 계정은 스냅샷에 포함돼 있을 수 있다. HTTP 요청 파일·내부 시드 안내에 적힌 테스트 폰/`Test1234!` 계정을 우선 확인한다. 관리자 예: `admin` / `operator` (`{noop}Test1234!`).

## 관련

- 스키마 문서: `../schema/mariadb_10_1/`
- 시드 안내(옛 전체 시드 제거): `../seed/README.md`
- 이 폴더는 공용 `share/` SoT — **ultary-api / ultary-web 해시 일치(MISMATCH 0)** 유지.
