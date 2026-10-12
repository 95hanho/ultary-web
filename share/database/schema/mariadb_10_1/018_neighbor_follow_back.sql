-- schema v23 → v24
-- 한 쌍 1행을 유지한 채, 수신자가 요청자를 맞팔할 수 있게 한다.
-- MariaDB 10.1. 한 문장 실행.

ALTER TABLE `ultary_neighbor`
  ADD COLUMN `followed_back` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1이면 수신자도 요청자를 팔로우. 요청자→수신자는 status=ACCEPTED' AFTER `status`,
  ADD COLUMN `followed_back_at` DATETIME NULL DEFAULT NULL COMMENT '맞팔한 시각' AFTER `followed_back`;
