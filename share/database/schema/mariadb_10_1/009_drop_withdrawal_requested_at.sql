-- schema v14 → v15
-- 쓰이지 않는 ultary_user.withdrawal_requested_at 을 제거한다.
-- MariaDB 10.1. 컬럼이 있을 때 1회 실행.

ALTER TABLE `ultary_user`
  DROP COLUMN `withdrawal_requested_at`;
