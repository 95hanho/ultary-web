-- ULTARY MariaDB 10.1.13 Schema
-- Engine: InnoDB
-- Charset / Collation: utf8 / utf8_general_ci
-- Delete policy: 서비스 데이터는 기본적으로 is_deleted/status 값으로 소프트 삭제 관리

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `ultary_ai_request_log`;
DROP TABLE IF EXISTS `ultary_report`;
DROP TABLE IF EXISTS `ultary_notification`;
DROP TABLE IF EXISTS `ultary_tag_image`;
DROP TABLE IF EXISTS `ultary_feed_tag`;
DROP TABLE IF EXISTS `ultary_tag`;
DROP TABLE IF EXISTS `ultary_feed_store`;
DROP TABLE IF EXISTS `ultary_feed_comment_mention`;
DROP TABLE IF EXISTS `ultary_feed_reply`;
DROP TABLE IF EXISTS `ultary_feed_comment`;
DROP TABLE IF EXISTS `ultary_feed_like`;
DROP TABLE IF EXISTS `ultary_feed_image`;
DROP TABLE IF EXISTS `ultary_feed_pet`;
DROP TABLE IF EXISTS `ultary_feed`;
DROP TABLE IF EXISTS `ultary_user_block`;
DROP TABLE IF EXISTS `ultary_neighbor`;
DROP TABLE IF EXISTS `ultary_pet`;
DROP TABLE IF EXISTS `ultary_token`;
DROP TABLE IF EXISTS `ultary_file`;
DROP TABLE IF EXISTS `ultary_admin`;
DROP TABLE IF EXISTS `ultary_user`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `ultary_user` (
  `user_no` INT(11) NOT NULL AUTO_INCREMENT,
  `login_id` VARCHAR(20) NOT NULL COMMENT '사용자 로그인 ID',
  `password` VARCHAR(200) NOT NULL,
  `name` VARCHAR(20) NULL DEFAULT NULL,
  `nickname` VARCHAR(30) NOT NULL COMMENT '서비스 내 표시 이름',
  `email` VARCHAR(50) NULL DEFAULT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `profile_file_id` INT(11) NULL DEFAULT NULL,
  `bio` VARCHAR(300) NULL DEFAULT NULL COMMENT '프로필 소개글',
  `region_sido` VARCHAR(30) NULL DEFAULT NULL COMMENT '동네 기반 기능용 시/도',
  `region_sigungu` VARCHAR(30) NULL DEFAULT NULL COMMENT '동네 기반 기능용 시/군/구',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `withdrawal_status` ENUM('ACTIVE','REQUESTED','WITHDRAWN') NOT NULL DEFAULT 'ACTIVE' COMMENT '회원 상태',
  `withdrawal_requested_at` DATETIME NULL DEFAULT NULL,
  `withdrawal_completed_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`user_no`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_login_id` (`login_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_nickname` (`nickname`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_email` (`email`) USING BTREE,
  KEY `IDX_ultary_user_profile_file_id` (`profile_file_id`) USING BTREE,
  KEY `IDX_ultary_user_withdrawal_status` (`withdrawal_status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자 계정 및 보호자 프로필';

CREATE TABLE `ultary_admin` (
  `admin_no` INT(11) NOT NULL AUTO_INCREMENT,
  `login_id` VARCHAR(200) NOT NULL,
  `password` VARCHAR(200) NOT NULL,
  `name` VARCHAR(20) NULL DEFAULT NULL,
  `role` ENUM('SUPER','OPERATOR') NOT NULL DEFAULT 'OPERATOR' COMMENT '관리자 권한',
  `status` ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT '관리자 상태',
  `last_login_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_no`) USING BTREE,
  UNIQUE KEY `UK_ultary_admin_login_id` (`login_id`) USING BTREE,
  KEY `IDX_ultary_admin_status` (`status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='관리자 계정';

CREATE TABLE `ultary_file` (
  `file_id` INT(11) NOT NULL AUTO_INCREMENT,
  `original_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '업로드 당시 원본 파일명',
  `store_name` VARCHAR(100) NOT NULL COMMENT '서버에 저장된 파일명',
  `extension` VARCHAR(10) NULL DEFAULT NULL,
  `mime_type` VARCHAR(100) NULL DEFAULT NULL,
  `file_size` INT(11) NULL DEFAULT NULL COMMENT 'byte 단위 파일 크기',
  `file_path` VARCHAR(300) NOT NULL,
  `copyright` VARCHAR(50) NULL DEFAULT NULL,
  `copyright_url` VARCHAR(300) NULL DEFAULT NULL,
  `uploaded_by_user_no` INT(11) NULL DEFAULT NULL,
  `uploaded_by_admin_no` INT(11) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`file_id`) USING BTREE,
  KEY `IDX_ultary_file_uploaded_by_user_no` (`uploaded_by_user_no`) USING BTREE,
  KEY `IDX_ultary_file_uploaded_by_admin_no` (`uploaded_by_admin_no`) USING BTREE,
  KEY `IDX_ultary_file_is_deleted` (`is_deleted`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='이미지 및 첨부파일 메타데이터';

CREATE TABLE `ultary_token` (
  `token_id` INT(11) NOT NULL AUTO_INCREMENT,
  `owner_type` ENUM('USER','ADMIN') NOT NULL COMMENT 'USER 또는 ADMIN',
  `user_no` INT(11) NULL DEFAULT NULL,
  `admin_no` INT(11) NULL DEFAULT NULL,
  `connect_ip` VARCHAR(50) NULL DEFAULT NULL,
  `connect_agent` VARCHAR(200) NULL DEFAULT NULL,
  `refresh_token` VARCHAR(500) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_revoked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '로그아웃/비밀번호 변경 등으로 토큰을 폐기했는지 여부',
  `revoked_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`) USING BTREE,
  KEY `IDX_ultary_token_user_no` (`user_no`) USING BTREE,
  KEY `IDX_ultary_token_admin_no` (`admin_no`) USING BTREE,
  KEY `IDX_ultary_token_owner_type` (`owner_type`) USING BTREE,
  KEY `IDX_ultary_token_expires_at` (`expires_at`) USING BTREE,
  KEY `IDX_ultary_token_is_revoked` (`is_revoked`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자/관리자 로그인 유지용 refresh token';

CREATE TABLE `ultary_pet` (
  `pet_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_no` INT(11) NOT NULL COMMENT '반려동물 보호자',
  `name` VARCHAR(30) NOT NULL,
  `species` ENUM('DOG','CAT','ETC') NOT NULL DEFAULT 'DOG',
  `breed` VARCHAR(50) NULL DEFAULT NULL COMMENT '품종',
  `gender` ENUM('MALE','FEMALE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `is_neutered` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '중성화 여부',
  `birthday` DATETIME NULL DEFAULT NULL,
  `profile_file_id` INT(11) NULL DEFAULT NULL,
  `bio` VARCHAR(300) NULL DEFAULT NULL COMMENT '반려동물 소개글',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`pet_id`) USING BTREE,
  KEY `IDX_ultary_pet_user_no` (`user_no`) USING BTREE,
  KEY `IDX_ultary_pet_profile_file_id` (`profile_file_id`) USING BTREE,
  KEY `IDX_ultary_pet_is_deleted` (`is_deleted`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자가 등록한 반려동물 프로필';

CREATE TABLE `ultary_neighbor` (
  `neighbor_id` INT(11) NOT NULL AUTO_INCREMENT,
  `requester_user_no` INT(11) NOT NULL COMMENT '이웃 요청을 보낸 사용자',
  `receiver_user_no` INT(11) NOT NULL COMMENT '이웃 요청을 받은 사용자',
  `pair_key` VARCHAR(50) NOT NULL COMMENT '역방향 중복 방지용 키. 작은 user_no:큰 user_no 형식',
  `status` ENUM('PENDING','ACCEPTED','REJECTED','BLOCKED') NOT NULL DEFAULT 'PENDING',
  `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `accepted_at` DATETIME NULL DEFAULT NULL,
  `rejected_at` DATETIME NULL DEFAULT NULL,
  `blocked_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`neighbor_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_neighbor_pair_key` (`pair_key`) USING BTREE,
  UNIQUE KEY `UK_ultary_neighbor_req_recv` (`requester_user_no`, `receiver_user_no`) USING BTREE,
  KEY `IDX_ultary_neighbor_receiver_status` (`receiver_user_no`, `status`) USING BTREE,
  KEY `IDX_ultary_neighbor_status` (`status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자 간 이웃 관계. 피드 공개 범위 NEIGHBORS의 기준';

CREATE TABLE `ultary_user_block` (
  `user_block_id` INT(11) NOT NULL AUTO_INCREMENT,
  `blocker_user_no` INT(11) NOT NULL COMMENT '차단한 사용자',
  `blocked_user_no` INT(11) NOT NULL COMMENT '차단된 사용자',
  `reason` VARCHAR(300) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`user_block_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_block_pair` (`blocker_user_no`, `blocked_user_no`) USING BTREE,
  KEY `IDX_ultary_user_block_blocked` (`blocked_user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자 차단 관계';

CREATE TABLE `ultary_feed` (
  `feed_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_no` INT(11) NOT NULL COMMENT '피드 작성자',
  `content` VARCHAR(1000) NULL DEFAULT NULL,
  `visibility` ENUM('PUBLIC','NEIGHBORS','PRIVATE') NOT NULL DEFAULT 'PUBLIC' COMMENT 'PUBLIC: 전체 공개, NEIGHBORS: 이웃 공개, PRIVATE: 나만 보기',
  `like_count` INT(11) NOT NULL DEFAULT 0,
  `comment_count` INT(11) NOT NULL DEFAULT 0,
  `store_count` INT(11) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_id`) USING BTREE,
  KEY `IDX_ultary_feed_user_created` (`user_no`, `created_at`) USING BTREE,
  KEY `IDX_ultary_feed_visibility_created` (`visibility`, `created_at`) USING BTREE,
  KEY `IDX_ultary_feed_is_deleted_created` (`is_deleted`, `created_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='반려동물 일상 피드';

CREATE TABLE `ultary_feed_pet` (
  `feed_pet_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `pet_id` INT(11) NOT NULL COMMENT '피드에 등장하는 반려동물',
  `added_by_user_no` INT(11) NOT NULL COMMENT '반려동물을 피드에 추가한 사용자',
  `status` ENUM('APPROVED','PENDING','REJECTED') NOT NULL DEFAULT 'APPROVED' COMMENT '본인 반려동물은 APPROVED, 이웃 반려동물은 PENDING 후 승인',
  `approved_by_user_no` INT(11) NULL DEFAULT NULL COMMENT '태그를 승인한 보호자',
  `approved_at` DATETIME NULL DEFAULT NULL,
  `rejected_at` DATETIME NULL DEFAULT NULL,
  `is_main` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '피드 대표 반려동물 여부',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`feed_pet_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_pet_feed_pet` (`feed_id`, `pet_id`) USING BTREE,
  KEY `IDX_ultary_feed_pet_pet_id` (`pet_id`) USING BTREE,
  KEY `IDX_ultary_feed_pet_added_by_user_no` (`added_by_user_no`) USING BTREE,
  KEY `IDX_ultary_feed_pet_approved_by_user_no` (`approved_by_user_no`) USING BTREE,
  KEY `IDX_ultary_feed_pet_status` (`status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드에 등장하는 반려동물 연결 테이블';

CREATE TABLE `ultary_feed_image` (
  `feed_image_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `file_id` INT(11) NOT NULL,
  `sort_order` INT(11) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`feed_image_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_image_sort` (`feed_id`, `sort_order`) USING BTREE,
  KEY `IDX_ultary_feed_image_file_id` (`file_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드 이미지 목록';

CREATE TABLE `ultary_feed_like` (
  `feed_like_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_like_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_like_feed_user` (`feed_id`, `user_no`) USING BTREE,
  KEY `IDX_ultary_feed_like_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드 좋아요';

CREATE TABLE `ultary_feed_comment` (
  `feed_comment_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL,
  `content` VARCHAR(500) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_comment_id`) USING BTREE,
  KEY `IDX_ultary_feed_comment_feed_created` (`feed_id`, `created_at`) USING BTREE,
  KEY `IDX_ultary_feed_comment_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드 댓글';

CREATE TABLE `ultary_feed_reply` (
  `feed_reply_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_comment_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL,
  `content` VARCHAR(500) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_reply_id`) USING BTREE,
  KEY `IDX_ultary_feed_reply_comment_created` (`feed_comment_id`, `created_at`) USING BTREE,
  KEY `IDX_ultary_feed_reply_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드 댓글의 답글';

CREATE TABLE `ultary_feed_comment_mention` (
  `feed_comment_mention_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_comment_id` INT(11) NULL DEFAULT NULL,
  `feed_reply_id` INT(11) NULL DEFAULT NULL,
  `mentioned_user_no` INT(11) NULL DEFAULT NULL COMMENT '언급된 사용자',
  `mentioned_pet_id` INT(11) NULL DEFAULT NULL COMMENT '언급된 반려동물',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feed_comment_mention_id`) USING BTREE,
  KEY `IDX_ultary_mention_comment_id` (`feed_comment_id`) USING BTREE,
  KEY `IDX_ultary_mention_reply_id` (`feed_reply_id`) USING BTREE,
  KEY `IDX_ultary_mention_user_no` (`mentioned_user_no`) USING BTREE,
  KEY `IDX_ultary_mention_pet_id` (`mentioned_pet_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='댓글/답글 내 사용자 또는 반려동물 언급';

CREATE TABLE `ultary_feed_store` (
  `feed_store_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_store_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_store_feed_user` (`feed_id`, `user_no`) USING BTREE,
  KEY `IDX_ultary_feed_store_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드 저장';

CREATE TABLE `ultary_tag` (
  `tag_id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(30) NOT NULL COMMENT '해시태그명',
  `title` VARCHAR(50) NULL DEFAULT NULL,
  `content` VARCHAR(500) NULL DEFAULT NULL,
  `link` VARCHAR(200) NULL DEFAULT NULL,
  `use_count` INT(11) NOT NULL DEFAULT 0,
  `created_by_user_no` INT(11) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`tag_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_tag_name` (`name`) USING BTREE,
  KEY `IDX_ultary_tag_created_by_user_no` (`created_by_user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드에 연결되는 태그/해시태그';

CREATE TABLE `ultary_feed_tag` (
  `feed_tag_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `tag_id` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_tag_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_tag_feed_tag` (`feed_id`, `tag_id`) USING BTREE,
  KEY `IDX_ultary_feed_tag_tag_id` (`tag_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드와 태그의 연결 테이블';

CREATE TABLE `ultary_tag_image` (
  `tag_image_id` INT(11) NOT NULL AUTO_INCREMENT,
  `tag_id` INT(11) NOT NULL,
  `file_id` INT(11) NOT NULL,
  `sort_order` INT(11) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tag_image_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_tag_image_sort` (`tag_id`, `sort_order`) USING BTREE,
  KEY `IDX_ultary_tag_image_file_id` (`file_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='태그 소개 이미지';

CREATE TABLE `ultary_notification` (
  `notification_id` INT(11) NOT NULL AUTO_INCREMENT,
  `receiver_user_no` INT(11) NOT NULL COMMENT '알림을 받는 사용자',
  `actor_user_no` INT(11) NULL DEFAULT NULL COMMENT '알림을 발생시킨 사용자. 시스템 알림이면 null 가능',
  `type` ENUM('FEED_LIKE','FEED_COMMENT','FEED_REPLY','MENTION','NEIGHBOR_REQUEST','NEIGHBOR_ACCEPTED','PET_TAG_REQUEST','PET_TAG_APPROVED','SYSTEM') NOT NULL,
  `feed_id` INT(11) NULL DEFAULT NULL,
  `feed_pet_id` INT(11) NULL DEFAULT NULL,
  `feed_comment_id` INT(11) NULL DEFAULT NULL,
  `feed_reply_id` INT(11) NULL DEFAULT NULL,
  `neighbor_id` INT(11) NULL DEFAULT NULL,
  `content` VARCHAR(300) NULL DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`) USING BTREE,
  KEY `IDX_ultary_notification_receiver_read` (`receiver_user_no`, `is_read`, `created_at`) USING BTREE,
  KEY `IDX_ultary_notification_actor_user_no` (`actor_user_no`) USING BTREE,
  KEY `IDX_ultary_notification_feed_id` (`feed_id`) USING BTREE,
  KEY `IDX_ultary_notification_feed_pet_id` (`feed_pet_id`) USING BTREE,
  KEY `IDX_ultary_notification_comment_id` (`feed_comment_id`) USING BTREE,
  KEY `IDX_ultary_notification_reply_id` (`feed_reply_id`) USING BTREE,
  KEY `IDX_ultary_notification_neighbor_id` (`neighbor_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='좋아요, 댓글, 답글, 멘션, 이웃 요청, 반려동물 태그 승인 알림';

CREATE TABLE `ultary_report` (
  `report_id` INT(11) NOT NULL AUTO_INCREMENT,
  `reporter_user_no` INT(11) NOT NULL,
  `target_type` ENUM('USER','PET','FEED','COMMENT','REPLY') NOT NULL,
  `target_user_no` INT(11) NULL DEFAULT NULL,
  `target_pet_id` INT(11) NULL DEFAULT NULL,
  `target_feed_id` INT(11) NULL DEFAULT NULL,
  `target_comment_id` INT(11) NULL DEFAULT NULL,
  `target_reply_id` INT(11) NULL DEFAULT NULL,
  `reason` VARCHAR(500) NOT NULL,
  `status` ENUM('PENDING','REVIEWING','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `admin_no` INT(11) NULL DEFAULT NULL,
  `processed_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`) USING BTREE,
  KEY `IDX_ultary_report_reporter_user_no` (`reporter_user_no`) USING BTREE,
  KEY `IDX_ultary_report_target_user_no` (`target_user_no`) USING BTREE,
  KEY `IDX_ultary_report_target_pet_id` (`target_pet_id`) USING BTREE,
  KEY `IDX_ultary_report_target_feed_id` (`target_feed_id`) USING BTREE,
  KEY `IDX_ultary_report_target_comment_id` (`target_comment_id`) USING BTREE,
  KEY `IDX_ultary_report_target_reply_id` (`target_reply_id`) USING BTREE,
  KEY `IDX_ultary_report_admin_no` (`admin_no`) USING BTREE,
  KEY `IDX_ultary_report_status_created` (`status`, `created_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자 신고 및 관리자 처리 이력';

CREATE TABLE `ultary_ai_request_log` (
  `ai_request_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_no` INT(11) NOT NULL,
  `feature_type` ENUM('FEED_CAPTION','HASHTAG','PET_PROFILE','COMMENT_FILTER','ALT_TEXT') NOT NULL,
  `target_feed_id` INT(11) NULL DEFAULT NULL,
  `target_pet_id` INT(11) NULL DEFAULT NULL,
  `prompt` VARCHAR(1000) NULL DEFAULT NULL,
  `result` VARCHAR(2000) NULL DEFAULT NULL,
  `model_name` VARCHAR(100) NULL DEFAULT NULL,
  `used_token_count` INT(11) NULL DEFAULT NULL,
  `status` ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  `error_message` VARCHAR(1000) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ai_request_id`) USING BTREE,
  KEY `IDX_ultary_ai_user_created` (`user_no`, `created_at`) USING BTREE,
  KEY `IDX_ultary_ai_target_feed_id` (`target_feed_id`) USING BTREE,
  KEY `IDX_ultary_ai_target_pet_id` (`target_pet_id`) USING BTREE,
  KEY `IDX_ultary_ai_feature_status` (`feature_type`, `status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='AI 문구 추천, 해시태그 추천, 프로필 소개, alt text 등 요청 이력';

ALTER TABLE `ultary_user`
  ADD CONSTRAINT `FK_user_profile_file` FOREIGN KEY (`profile_file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_file`
  ADD CONSTRAINT `FK_file_uploaded_user` FOREIGN KEY (`uploaded_by_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_file_uploaded_admin` FOREIGN KEY (`uploaded_by_admin_no`) REFERENCES `ultary_admin` (`admin_no`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_token`
  ADD CONSTRAINT `FK_token_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_token_admin` FOREIGN KEY (`admin_no`) REFERENCES `ultary_admin` (`admin_no`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ultary_pet`
  ADD CONSTRAINT `FK_pet_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_pet_profile_file` FOREIGN KEY (`profile_file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_neighbor`
  ADD CONSTRAINT `FK_neighbor_requester` FOREIGN KEY (`requester_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_neighbor_receiver` FOREIGN KEY (`receiver_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_user_block`
  ADD CONSTRAINT `FK_user_block_blocker` FOREIGN KEY (`blocker_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_user_block_blocked` FOREIGN KEY (`blocked_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed`
  ADD CONSTRAINT `FK_feed_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_pet`
  ADD CONSTRAINT `FK_feed_pet_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_pet_pet` FOREIGN KEY (`pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_pet_added_user` FOREIGN KEY (`added_by_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_pet_approved_user` FOREIGN KEY (`approved_by_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_feed_image`
  ADD CONSTRAINT `FK_feed_image_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_image_file` FOREIGN KEY (`file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_like`
  ADD CONSTRAINT `FK_feed_like_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_like_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_comment`
  ADD CONSTRAINT `FK_feed_comment_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_comment_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_reply`
  ADD CONSTRAINT `FK_feed_reply_comment` FOREIGN KEY (`feed_comment_id`) REFERENCES `ultary_feed_comment` (`feed_comment_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_reply_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_comment_mention`
  ADD CONSTRAINT `FK_mention_comment` FOREIGN KEY (`feed_comment_id`) REFERENCES `ultary_feed_comment` (`feed_comment_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_mention_reply` FOREIGN KEY (`feed_reply_id`) REFERENCES `ultary_feed_reply` (`feed_reply_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_mention_user` FOREIGN KEY (`mentioned_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_mention_pet` FOREIGN KEY (`mentioned_pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_feed_store`
  ADD CONSTRAINT `FK_feed_store_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_store_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_tag`
  ADD CONSTRAINT `FK_tag_user` FOREIGN KEY (`created_by_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_feed_tag`
  ADD CONSTRAINT `FK_feed_tag_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_tag_tag` FOREIGN KEY (`tag_id`) REFERENCES `ultary_tag` (`tag_id`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_tag_image`
  ADD CONSTRAINT `FK_tag_image_tag` FOREIGN KEY (`tag_id`) REFERENCES `ultary_tag` (`tag_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_tag_image_file` FOREIGN KEY (`file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_notification`
  ADD CONSTRAINT `FK_notification_receiver` FOREIGN KEY (`receiver_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_notification_actor` FOREIGN KEY (`actor_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_feed_pet` FOREIGN KEY (`feed_pet_id`) REFERENCES `ultary_feed_pet` (`feed_pet_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_comment` FOREIGN KEY (`feed_comment_id`) REFERENCES `ultary_feed_comment` (`feed_comment_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_reply` FOREIGN KEY (`feed_reply_id`) REFERENCES `ultary_feed_reply` (`feed_reply_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_neighbor` FOREIGN KEY (`neighbor_id`) REFERENCES `ultary_neighbor` (`neighbor_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_report`
  ADD CONSTRAINT `FK_report_reporter` FOREIGN KEY (`reporter_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_report_target_user` FOREIGN KEY (`target_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_report_target_pet` FOREIGN KEY (`target_pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_report_target_feed` FOREIGN KEY (`target_feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_report_target_comment` FOREIGN KEY (`target_comment_id`) REFERENCES `ultary_feed_comment` (`feed_comment_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_report_target_reply` FOREIGN KEY (`target_reply_id`) REFERENCES `ultary_feed_reply` (`feed_reply_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_report_admin` FOREIGN KEY (`admin_no`) REFERENCES `ultary_admin` (`admin_no`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_ai_request_log`
  ADD CONSTRAINT `FK_ai_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_ai_target_feed` FOREIGN KEY (`target_feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_ai_target_pet` FOREIGN KEY (`target_pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE SET NULL;
