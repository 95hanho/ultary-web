-- schema v19 → v20
-- ultary_user 에 회원 정지 상태와 정지 시각을 넣는다.
-- MariaDB 10.1. ENUM에 SUSPENDED 가 없을 때 1회 실행.

ALTER TABLE `ultary_user`
  MODIFY COLUMN `withdrawal_status` ENUM('ACTIVE','REQUESTED','WITHDRAWN','SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT '회원 상태. SUSPENDED=관리자 정지';

ALTER TABLE `ultary_user`
  ADD COLUMN `suspended_at` DATETIME NULL DEFAULT NULL COMMENT '회원 정지 시각. 해제하면 NULL' AFTER `withdrawal_completed_at`;
