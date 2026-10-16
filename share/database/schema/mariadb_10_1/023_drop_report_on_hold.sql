-- v28 → v29: ultary_report.status 에서 ON_HOLD(보류) 제거
-- 기존 보류 행은 CONFIRMED(확인)로 옮긴다.

UPDATE ultary_report
SET status = 'CONFIRMED',
    processed_at = IFNULL(processed_at, NOW()),
    updated_at = NOW()
WHERE status = 'ON_HOLD';

ALTER TABLE `ultary_report`
  MODIFY COLUMN `status` ENUM('REQUESTED','CONFIRMED','DELETED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'REQUESTED' COMMENT 'REQUESTED 신고요청, CONFIRMED 확인, DELETED 삭제조치, REJECTED 거절, SUSPENDED 정지';
