-- schema v12 → v13
-- 사진 태그·스토리 @ 에서 고른 최근 펫.
-- ultary_user_search_history(들어간 유저 울타리)와 섞지 않는다.
-- MariaDB 10.1. 테이블이 이미 있으면 CREATE 는 건너뛴다.
-- ALTER 는 최초 1회. FK 가 있으면 이 ALTER 만 실행하지 않는다.

CREATE TABLE IF NOT EXISTS `ultary_user_pet_tag_history` (
  `user_pet_tag_history_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_no` INT(11) NOT NULL COMMENT '스토리 @ 또는 사진 태그에서 펫을 고른 사용자',
  `pet_id` INT(11) NOT NULL COMMENT '고른 반려동물',
  `used_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '같은 펫을 다시 고르면 이 시각만 갱신',
  PRIMARY KEY (`user_pet_tag_history_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_pet_tag_pair` (`user_no`, `pet_id`) USING BTREE,
  KEY `IDX_ultary_user_pet_tag_user_time` (`user_no`, `used_at`) USING BTREE,
  KEY `IDX_ultary_user_pet_tag_pet_id` (`pet_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사진·스토리 최근 펫 태그. 검색 최근 울타리와 별도. 한 사람당 펫 1행';

ALTER TABLE `ultary_user_pet_tag_history`
  ADD CONSTRAINT `FK_user_pet_tag_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_user_pet_tag_pet` FOREIGN KEY (`pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE CASCADE;
