-- 기존 버전에서 탈퇴 후 남은 소셜 연결만 해제한다. DDL 변경 없음.
-- 실행 전 대상 ultary_user_social 행을 비공개 백업한다.
-- ACTIVE/SUSPENDED 등 탈퇴 완료가 아닌 계정의 연결은 유지한다.
START TRANSACTION;
DELETE s FROM ultary_user_social s
INNER JOIN ultary_user u ON u.user_no = s.user_no
WHERE u.withdrawal_status = 'WITHDRAWN';
COMMIT;
