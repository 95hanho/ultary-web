-- schema v20 → v21
-- ultary_report.reason 을 자유 입력에서 신고 사유 ENUM 으로 바꾼다.
-- MariaDB 10.1. reason 이 VARCHAR 일 때 한 문장씩 실행.

ALTER TABLE `ultary_report`
  ADD COLUMN `reason_code` ENUM('SPAM','ABUSE','HARASSMENT','SEXUAL','VIOLENCE','HATE','IMPERSONATION','PRIVACY','OTHER') NULL DEFAULT NULL COMMENT '신고 사유' AFTER `target_reply_id`;

UPDATE `ultary_report`
SET `reason_code` = CASE `reason`
  WHEN '스팸 계정' THEN 'SPAM'
  WHEN '타인 반려동물 도용' THEN 'IMPERSONATION'
  WHEN '광고성 게시글' THEN 'SPAM'
  WHEN '욕설 댓글' THEN 'ABUSE'
  WHEN '답글 비방' THEN 'ABUSE'
  ELSE 'OTHER'
END;

ALTER TABLE `ultary_report` DROP COLUMN `reason`;

ALTER TABLE `ultary_report`
  CHANGE COLUMN `reason_code` `reason` ENUM('SPAM','ABUSE','HARASSMENT','SEXUAL','VIOLENCE','HATE','IMPERSONATION','PRIVACY','OTHER') NOT NULL COMMENT 'SPAM 스팸·광고, ABUSE 욕설·비방, HARASSMENT 괴롭힘, SEXUAL 음란, VIOLENCE 폭력, HATE 혐오, IMPERSONATION 사칭, PRIVACY 개인정보, OTHER 기타';
