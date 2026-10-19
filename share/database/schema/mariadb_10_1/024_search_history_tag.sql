-- schema v29 → v30
-- 최근 검색에 태그(해시태그) 피드 진입 이력 추가
-- USER: target_user_no / TAG: target_tag_id (둘 중 하나만)

ALTER TABLE `ultary_user_search_history`
  MODIFY COLUMN `target_user_no` INT(11) NULL DEFAULT NULL COMMENT '들어간 울타리 주인. 태그 이력이면 NULL',
  ADD COLUMN `target_tag_id` INT(11) NULL DEFAULT NULL COMMENT '들어간 태그 피드. 울타리 이력이면 NULL' AFTER `target_user_no`;

ALTER TABLE `ultary_user_search_history`
  DROP INDEX `UK_ultary_user_search_pair`;

ALTER TABLE `ultary_user_search_history`
  ADD UNIQUE KEY `UK_ultary_user_search_user` (`user_no`, `target_user_no`) USING BTREE,
  ADD UNIQUE KEY `UK_ultary_user_search_tag` (`user_no`, `target_tag_id`) USING BTREE,
  ADD KEY `IDX_ultary_user_search_target_tag` (`target_tag_id`) USING BTREE;
