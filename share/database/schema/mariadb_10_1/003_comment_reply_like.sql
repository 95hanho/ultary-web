-- schema v8 → v9
-- 댓글·답글 좋아요 (피드 좋아요와 별도). 기존 DB에 1회 실행.

ALTER TABLE `ultary_feed_comment`
  ADD COLUMN `like_count` INT(11) NOT NULL DEFAULT 0 AFTER `content`;

ALTER TABLE `ultary_feed_reply`
  ADD COLUMN `like_count` INT(11) NOT NULL DEFAULT 0 AFTER `content`;

CREATE TABLE `ultary_feed_comment_like` (
  `feed_comment_like_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_comment_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_comment_like_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_comment_like_comment_user` (`feed_comment_id`, `user_no`) USING BTREE,
  KEY `IDX_ultary_feed_comment_like_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='댓글 좋아요';

CREATE TABLE `ultary_feed_reply_like` (
  `feed_reply_like_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_reply_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_reply_like_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_reply_like_reply_user` (`feed_reply_id`, `user_no`) USING BTREE,
  KEY `IDX_ultary_feed_reply_like_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='답글 좋아요';

ALTER TABLE `ultary_feed_comment_like`
  ADD CONSTRAINT `FK_feed_comment_like_comment` FOREIGN KEY (`feed_comment_id`) REFERENCES `ultary_feed_comment` (`feed_comment_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_comment_like_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_reply_like`
  ADD CONSTRAINT `FK_feed_reply_like_reply` FOREIGN KEY (`feed_reply_id`) REFERENCES `ultary_feed_reply` (`feed_reply_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_reply_like_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;
