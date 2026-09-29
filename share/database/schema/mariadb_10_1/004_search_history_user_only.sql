-- schema v9 → v10
-- 최근 검색은 검색어·펫·태그가 아니라, 검색 후 들어간 유저 울타리만 남긴다.
-- 기존 DB에 1회 실행. target_user_no 가 NULL 인 행이 있으면 먼저 지운다.

ALTER TABLE `ultary_user_search_history`
  DROP FOREIGN KEY `FK_user_search_target_pet`,
  DROP FOREIGN KEY `FK_user_search_target_tag`,
  DROP FOREIGN KEY `FK_user_search_target_user`,
  DROP FOREIGN KEY `FK_user_search_user`;

ALTER TABLE `ultary_user_search_history`
  DROP INDEX `IDX_ultary_user_search_type`,
  DROP INDEX `IDX_ultary_user_search_target_pet`,
  DROP INDEX `IDX_ultary_user_search_target_tag`;

ALTER TABLE `ultary_user_search_history`
  DROP COLUMN `search_type`,
  DROP COLUMN `target_pet_id`,
  DROP COLUMN `target_tag_id`,
  DROP COLUMN `keyword`;

DELETE FROM `ultary_user_search_history` WHERE `target_user_no` IS NULL;

ALTER TABLE `ultary_user_search_history`
  MODIFY COLUMN `user_no` INT(11) NOT NULL COMMENT '검색 후 울타리에 들어간 사용자',
  MODIFY COLUMN `target_user_no` INT(11) NOT NULL COMMENT '들어간 울타리 주인',
  MODIFY COLUMN `searched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '같은 울타리 재방문 시 갱신',
  ADD UNIQUE KEY `UK_ultary_user_search_pair` (`user_no`, `target_user_no`);

ALTER TABLE `ultary_user_search_history`
  ADD CONSTRAINT `FK_user_search_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_user_search_target_user` FOREIGN KEY (`target_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE,
  COMMENT = '검색에서 들어간 유저 울타리. 한 사람당 대상 유저 1행';
