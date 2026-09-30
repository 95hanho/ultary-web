-- schema v11 → v12
-- 스토리 사진 위 글자, 펫 위치 멘션
-- MariaDB 10.1. 이미 있으면 건너뛴다.

CREATE TABLE IF NOT EXISTS `ultary_story_text` (
  `story_text_id` INT(11) NOT NULL AUTO_INCREMENT,
  `story_id` INT(11) NOT NULL,
  `content` VARCHAR(200) NOT NULL COMMENT '사진 위 글자',
  `font_size` INT(11) NOT NULL DEFAULT 16 COMMENT '12|16|20|24. 기본 16',
  `is_bold` TINYINT(1) NOT NULL DEFAULT 0,
  `is_underline` TINYINT(1) NOT NULL DEFAULT 0,
  `is_strikethrough` TINYINT(1) NOT NULL DEFAULT 0,
  `color` CHAR(7) NOT NULL COMMENT '#RRGGBB',
  `pos_x` DECIMAL(5,2) NOT NULL COMMENT '가로 위치 % (0.00~100.00)',
  `pos_y` DECIMAL(5,2) NOT NULL COMMENT '세로 위치 % (0.00~100.00)',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '요청 배열 순서. 뒤에 올수록 위',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`story_text_id`) USING BTREE,
  KEY `IDX_ultary_story_text_story` (`story_id`, `sort_order`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='스토리 사진 위 글자';

CREATE TABLE IF NOT EXISTS `ultary_story_mention` (
  `story_mention_id` INT(11) NOT NULL AUTO_INCREMENT,
  `story_id` INT(11) NOT NULL,
  `pet_id` INT(11) NOT NULL COMMENT '@mention_id 대상 반려동물. pet_id 1:1',
  `pos_x` DECIMAL(5,2) NOT NULL COMMENT '가로 위치 % (0.00~100.00)',
  `pos_y` DECIMAL(5,2) NOT NULL COMMENT '세로 위치 % (0.00~100.00)',
  `sort_order` INT(11) NOT NULL DEFAULT 0,
  `added_by_user_no` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`story_mention_id`) USING BTREE,
  KEY `IDX_ultary_story_mention_story` (`story_id`, `sort_order`) USING BTREE,
  KEY `IDX_ultary_story_mention_pet_id` (`pet_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='스토리 사진 위 @반려동물 위치 멘션';
