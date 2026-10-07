-- schema v18 → v19
-- 울타리 고정(구 저장)과 나만 보는 저장을 나눈다.
-- MariaDB 10.1. ultary_feed_store 가 있을 때 1회 실행.

RENAME TABLE `ultary_feed_store` TO `ultary_feed_pin`;

ALTER TABLE `ultary_feed_pin`
  DROP FOREIGN KEY `FK_feed_store_feed`,
  DROP FOREIGN KEY `FK_feed_store_user`,
  CHANGE COLUMN `feed_store_id` `feed_pin_id` INT(11) NOT NULL AUTO_INCREMENT,
  DROP INDEX `UK_ultary_feed_store_feed_user`,
  DROP INDEX `IDX_ultary_feed_store_user_no`,
  ADD UNIQUE KEY `UK_ultary_feed_pin_feed_user` (`feed_id`, `user_no`),
  ADD KEY `IDX_ultary_feed_pin_user_no` (`user_no`),
  COMMENT = '울타리에 보여주는 고정 게시글';

ALTER TABLE `ultary_feed_pin`
  ADD CONSTRAINT `FK_feed_pin_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_pin_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed`
  CHANGE COLUMN `store_count` `pin_count` INT(11) NOT NULL DEFAULT 0 COMMENT '울타리에 고정한 사람 수';

CREATE TABLE IF NOT EXISTS `ultary_feed_save` (
  `feed_save_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL COMMENT '나만 보는 저장을 한 사용자',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_save_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_save_feed_user` (`feed_id`, `user_no`) USING BTREE,
  KEY `IDX_ultary_feed_save_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='나만 보는 저장 게시글';

ALTER TABLE `ultary_feed_save`
  ADD CONSTRAINT `FK_feed_save_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_save_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;
