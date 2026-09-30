-- schema v13 → v14
-- 알림을 화면 항목 단위로 1행 집계하고, 스토리 공감 테이블을 추가한다.
-- MariaDB 10.1. 알림 테이블에 행이 없는 상태에서 1회 실행.
-- FK ALTER 는 제약이 없을 때만 실행한다.

CREATE TABLE IF NOT EXISTS `ultary_story_like` (
  `story_like_id` INT(11) NOT NULL AUTO_INCREMENT,
  `story_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`story_like_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_story_like_story_user` (`story_id`, `user_no`) USING BTREE,
  KEY `IDX_ultary_story_like_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='스토리 공감. 피드 좋아요와 별도';

ALTER TABLE `ultary_notification`
  ADD COLUMN `story_id` INT(11) NULL DEFAULT NULL AFTER `feed_reply_id`,
  ADD COLUMN `actor_count` INT(11) NOT NULL DEFAULT 1 AFTER `content`,
  ADD COLUMN `has_comment` TINYINT(1) NOT NULL DEFAULT 0 AFTER `actor_count`,
  ADD COLUMN `has_reply` TINYINT(1) NOT NULL DEFAULT 0 AFTER `has_comment`,
  ADD COLUMN `group_key` VARCHAR(80) NOT NULL AFTER `has_reply`,
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `created_at`;

ALTER TABLE `ultary_notification`
  MODIFY `type` ENUM('NEIGHBOR_REQUEST','FEED_LIKE','COMMENT_LIKE','REPLY_LIKE','FEED_COMMENT','COMMENT_MENTION','REPLY_MENTION','FEED_TAG','STORY_TAG','STORY_LIKE') NOT NULL,
  MODIFY `content` VARCHAR(80) NULL DEFAULT NULL COMMENT '인용 텍스트 일부. 댓글·답글 통합은 최신 글로 덮어씀';

ALTER TABLE `ultary_notification`
  ADD UNIQUE KEY `UK_ultary_notification_receiver_group` (`receiver_user_no`, `group_key`),
  ADD KEY `IDX_ultary_notification_receiver_updated` (`receiver_user_no`, `updated_at`),
  ADD KEY `IDX_ultary_notification_story_id` (`story_id`);

ALTER TABLE `ultary_notification`
  ADD CONSTRAINT `FK_notification_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_story_like`
  ADD CONSTRAINT `FK_story_like_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_story_like_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;
