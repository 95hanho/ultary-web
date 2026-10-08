-- schema v22 → v23
-- ultary_report.status 에 CONFIRMED(확인)를 넣는다.
-- 신고자 취소는 REQUESTED(신고요청)일 때만.
-- MariaDB 10.1. 한 문장 실행.

ALTER TABLE `ultary_report`
  MODIFY COLUMN `status` ENUM('REQUESTED','CONFIRMED','DELETED','REJECTED','ON_HOLD','SUSPENDED') NOT NULL DEFAULT 'REQUESTED' COMMENT 'REQUESTED 신고요청, CONFIRMED 확인, DELETED 삭제조치, REJECTED 거절, ON_HOLD 보류, SUSPENDED 정지';
