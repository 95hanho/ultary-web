-- schema v40 → v41
-- 게시글(피드) 본문 최대 500자. 댓글·답글은 100자 유지.
-- 모더레이션 스냅샷도 피드 본문을 담을 수 있게 500자로 맞춤.

ALTER TABLE `ultary_feed`
  MODIFY COLUMN `content` VARCHAR(500) NULL DEFAULT NULL COMMENT '본문. 해시태그 텍스트 포함 최대 500자';

ALTER TABLE `ultary_ai_moderation_state`
  MODIFY COLUMN `approved_content` VARCHAR(500) NULL;

ALTER TABLE `ultary_ai_moderation_job`
  MODIFY COLUMN `content` VARCHAR(500) NULL;
