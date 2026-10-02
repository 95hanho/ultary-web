-- schema v17 → v18
-- 1:1 메시지. 게시글은 공유한 캐러셀 사진, 스토리는 그 사진만.
-- MariaDB 10.1. 테이블이 없을 때 1회 실행.

CREATE TABLE IF NOT EXISTS `ultary_dm_room` (
  `dm_room_id` INT(11) NOT NULL AUTO_INCREMENT,
  `pair_key` VARCHAR(32) NOT NULL COMMENT 'minUserNo:maxUserNo. 한 쌍에 방 1개',
  `user_low` INT(11) NOT NULL COMMENT 'user_no가 더 작은 참여자',
  `user_high` INT(11) NOT NULL COMMENT 'user_no가 더 큰 참여자',
  `low_last_read_message_id` INT(11) NULL DEFAULT NULL COMMENT 'user_low가 읽은 마지막 메시지',
  `high_last_read_message_id` INT(11) NULL DEFAULT NULL COMMENT 'user_high가 읽은 마지막 메시지',
  `low_left_at` DATETIME NULL DEFAULT NULL COMMENT 'user_low가 나간 시각. 상대 새 메시지가 오면 비움',
  `high_left_at` DATETIME NULL DEFAULT NULL COMMENT 'user_high가 나간 시각. 상대 새 메시지가 오면 비움',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`dm_room_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_dm_room_pair_key` (`pair_key`) USING BTREE,
  KEY `IDX_ultary_dm_room_user_low` (`user_low`) USING BTREE,
  KEY `IDX_ultary_dm_room_user_high` (`user_high`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='1:1 메시지 방';

CREATE TABLE IF NOT EXISTS `ultary_dm_message` (
  `dm_message_id` INT(11) NOT NULL AUTO_INCREMENT,
  `dm_room_id` INT(11) NOT NULL,
  `sender_user_no` INT(11) NOT NULL,
  `body` VARCHAR(1000) NULL DEFAULT NULL COMMENT '같이 보내는 글. 공유만 있으면 NULL',
  `share_type` ENUM('NONE','FEED','STORY') NOT NULL DEFAULT 'NONE',
  `feed_id` INT(11) NULL DEFAULT NULL COMMENT '공유한 게시글',
  `feed_media_id` INT(11) NULL DEFAULT NULL COMMENT '공유한 캐러셀 사진. sort_order로 몇 번째인지 조회',
  `story_id` INT(11) NULL DEFAULT NULL COMMENT '공유한 스토리. 미리보기는 그 사진만',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`dm_message_id`) USING BTREE,
  KEY `IDX_ultary_dm_message_room` (`dm_room_id`, `dm_message_id`) USING BTREE,
  KEY `IDX_ultary_dm_message_feed` (`feed_id`) USING BTREE,
  KEY `IDX_ultary_dm_message_feed_media` (`feed_media_id`) USING BTREE,
  KEY `IDX_ultary_dm_message_story` (`story_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='DM 메시지. 글, 게시글 사진, 스토리 사진';

ALTER TABLE `ultary_dm_room`
  ADD CONSTRAINT `FK_dm_room_user_low` FOREIGN KEY (`user_low`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_dm_room_user_high` FOREIGN KEY (`user_high`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_dm_message`
  ADD CONSTRAINT `FK_dm_message_room` FOREIGN KEY (`dm_room_id`) REFERENCES `ultary_dm_room` (`dm_room_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_dm_message_sender` FOREIGN KEY (`sender_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_dm_message_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_dm_message_feed_media` FOREIGN KEY (`feed_media_id`) REFERENCES `ultary_feed_media` (`feed_media_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_dm_message_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE SET NULL;
