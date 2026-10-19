-- schema v30 → v31
-- 게시글·댓글·답글 본문 최대 100자 (해시태그 텍스트 포함)

ALTER TABLE `ultary_feed`
  MODIFY COLUMN `content` VARCHAR(100) NULL DEFAULT NULL COMMENT '본문. 해시태그 텍스트 포함 최대 100자';

ALTER TABLE `ultary_feed_comment`
  MODIFY COLUMN `content` VARCHAR(100) NOT NULL;

ALTER TABLE `ultary_feed_reply`
  MODIFY COLUMN `content` VARCHAR(100) NOT NULL;
