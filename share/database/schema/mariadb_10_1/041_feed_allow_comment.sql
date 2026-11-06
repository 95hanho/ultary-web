-- v43: 게시글별 댓글 허용. 계정 privacy의 allow_comment·neighbor_request 제거
-- MariaDB 10.1

ALTER TABLE `ultary_feed`
  ADD COLUMN `allow_comment` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1이면 댓글·답글 허용. 끄면 작성자만 가능'
  AFTER `visibility`;

ALTER TABLE `ultary_user_privacy`
  DROP COLUMN `neighbor_request`,
  DROP COLUMN `allow_comment`;
