-- schema_version: 7
-- ULTARY MariaDB 10.1.13 Schema
-- Engine: InnoDB
-- Charset / Collation: utf8 / utf8_general_ci
-- Delete policy: 서비스 데이터는 기본적으로 is_deleted/status 값으로 소프트 삭제 관리
-- Auth note:
--   - 일반 사용자 login_id 없음 (소셜 우선, 이후 email/phone + password 로그인)
--   - password는 최초 NULL, 사용자가 나중에 설정 가능
--   - 소셜 가입 시 nickname = google|kakao + 랜덤영문 (underscore/숫자 없음), is_default_nickname=1
-- Naming / search note:
--   - 전체 검색 대상 3종: NICKNAME(유저), PET(@mention_id), TAG(#hashtag, 필요 시 handle로 구분)
--   - @ : 반려동물 mention_id
--       · 이미지 위치 멘션 = ultary_feed_media_mention (승인 없음, 자유)
--       · 공동작성 = ultary_feed_pet.role=COLLABORATOR (멘션된 피드 목록 / 삭제 권한)
--   - # : 태그 hashtag (본문 태그, 상품·소개 태그). hashtag는 중복 가능·생성 후 불변, handle로 좁힘
--   - 닉네임 허용: 영문·한글만. 한글만 2~5자, 영문만 4~10자. 혼합 시 한글1자=2, 영문1자=1, 가중치 합 4~10 (한글 최대 5자)
--   - mention_id / tag.handle 허용: 영문·숫자·언더바 (^[A-Za-z0-9_]{1,30}$), UNIQUE, utf8_general_ci라 대소문자 동일 취급
--   - 최근 검색: user 컬럼이 아니라 ultary_user_search_history (다건·search_type)
--   - 피드 삭제: 작성자(user_no) 또는 COLLABORATOR 펫 보호자. deleted_by_user_no에 실제 삭제자 기록
-- Identity change cooldown (생성 직후부터 잠금, *_changed_at에 기록):
--   - user.nickname          : 변경 후(및 생성 직후) 7일간 재변경 불가
--   - pet.mention_id         : 변경 후(및 생성 직후) 30일간 재변경 불가. pet.name은 생성 후 불변
--   - tag.handle             : 설정·변경 후 30일간 재변경 불가. tag.hashtag는 생성 후 불변
--     · handle이 NULL인 태그: handle_changed_at NULL → 최초 설정은 언제든 가능
-- Tag column rename (v3 name/title → v4):
--   - hashtag  : # 입력용 표시 키 (필수, 중복 허용)  ← 구 name
--   - title    : 상품/소개 표시명 (선택, 길게)
--   - handle   : 선택 고유 코드 (중복 hashtag 구분용, pet.mention_id와 동일 정규식)  ← mention_id 대신 handle
-- Story note (v7):
--   - ultary_story: IMAGE|VIDEO 1건 = 스토리 1건. expires_at = created_at + 24h
--   - ultary_story_view: 시청자별 읽음 (story_id + viewer_user_no UNIQUE)
--   - 활성 스토리 = is_deleted=0 AND expires_at > NOW()
-- Change log:
--   v1: 초기 스키마 (Phase 1-1)
--   v2: 소셜 로그인 / login_id 제거 / is_default_nickname (Phase 1-6)
--   v3: ultary_feed_image → ultary_feed_media (IMAGE|VIDEO, thumbnail, duration)
--   v4: pet.mention_id, tag hashtag/handle, feed_m 알림 PET_TAG_* 제거 / FEED_COLLABORATOR 추가
--   v6: nickname_changed_at / mention_id_changed_at / handle_changed_at (식별자 변경 쿨다운)
--   v7: ultary_story / ultary_story_view (24h 스토리·읽음)

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `ultary_ai_request_log`;
DROP TABLE IF EXISTS `ultary_report`;
DROP TABLE IF EXISTS `ultary_notification`;
DROP TABLE IF EXISTS `ultary_story_view`;
DROP TABLE IF EXISTS `ultary_story`;
DROP TABLE IF EXISTS `ultary_user_search_history`;
DROP TABLE IF EXISTS `ultary_tag_image`;
DROP TABLE IF EXISTS `ultary_feed_tag`;
DROP TABLE IF EXISTS `ultary_tag`;
DROP TABLE IF EXISTS `ultary_feed_store`;
DROP TABLE IF EXISTS `ultary_feed_comment_mention`;
DROP TABLE IF EXISTS `ultary_feed_reply`;
DROP TABLE IF EXISTS `ultary_feed_comment`;
DROP TABLE IF EXISTS `ultary_feed_like`;
DROP TABLE IF EXISTS `ultary_feed_media_mention`;
DROP TABLE IF EXISTS `ultary_feed_media`;
DROP TABLE IF EXISTS `ultary_feed_pet`;
DROP TABLE IF EXISTS `ultary_feed`;
DROP TABLE IF EXISTS `ultary_user_block`;
DROP TABLE IF EXISTS `ultary_neighbor`;
DROP TABLE IF EXISTS `ultary_pet`;
DROP TABLE IF EXISTS `ultary_user_social`;
DROP TABLE IF EXISTS `ultary_token`;
DROP TABLE IF EXISTS `ultary_file`;
DROP TABLE IF EXISTS `ultary_admin`;
DROP TABLE IF EXISTS `ultary_user`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `ultary_user` (
  `user_no` INT(11) NOT NULL AUTO_INCREMENT,
  `password` VARCHAR(200) NULL DEFAULT NULL COMMENT 'BCrypt 해시. 소셜만 사용 시 NULL, 이후 설정 가능',
  `name` VARCHAR(20) NULL DEFAULT NULL,
  `nickname` VARCHAR(30) NOT NULL COMMENT '표시 이름. 한글 2~5 / 영문 4~10 / 혼합은 한글1=2 가중치 합 4~10. 소셜 가입 시 google|kakao + 랜덤영문(총 10자)',
  `nickname_changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '닉네임 마지막 변경(또는 최초 부여) 시각. 생성 직후부터 7일간 재변경 불가',
  `is_default_nickname` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=자동 생성 닉네임(변경 유도 대상), 0=사용자가 직접 변경함',
  `email` VARCHAR(50) NULL DEFAULT NULL COMMENT '소셜에서 전달되거나 이후 등록. 비밀번호 로그인 식별자로 사용 가능',
  `phone` VARCHAR(20) NULL DEFAULT NULL COMMENT '본인인증 후 등록. 비밀번호 로그인 식별자로 사용 가능',
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
  UNIQUE KEY `UK_ultary_user_nickname` (`nickname`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_email` (`email`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_phone` (`phone`) USING BTREE,
  KEY `IDX_ultary_user_profile_file_id` (`profile_file_id`) USING BTREE,
  KEY `IDX_ultary_user_is_default_nickname` (`is_default_nickname`) USING BTREE,
  KEY `IDX_ultary_user_withdrawal_status` (`withdrawal_status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자 계정 및 보호자 프로필';

CREATE TABLE `ultary_user_social` (
  `user_social_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_no` INT(11) NOT NULL COMMENT '연결된 ultary_user',
  `provider` ENUM('GOOGLE','KAKAO') NOT NULL COMMENT '소셜 로그인 제공자',
  `provider_user_id` VARCHAR(100) NOT NULL COMMENT '제공자 측 고유 사용자 ID (sub / id)',
  `provider_email` VARCHAR(100) NULL DEFAULT NULL COMMENT '제공자에서 받은 이메일 스냅샷',
  `linked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_social_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_social_provider_uid` (`provider`, `provider_user_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_social_user_provider` (`user_no`, `provider`) USING BTREE,
  KEY `IDX_ultary_user_social_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자-소셜 계정 연결 (Google/Kakao)';

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
  `mention_id` VARCHAR(30) NOT NULL COMMENT '@멘션 핸들. 영문·숫자·_ 만. 전역 UNIQUE (대소문자 무시)',
  `mention_id_changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'mention_id 마지막 변경(또는 최초 부여) 시각. 생성 직후부터 30일간 재변경 불가',
  `name` VARCHAR(30) NOT NULL COMMENT '화면에 보이는 반려동물 이름. 생성 후 변경 불가',
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
  UNIQUE KEY `UK_ultary_pet_mention_id` (`mention_id`) USING BTREE,
  KEY `IDX_ultary_pet_user_no` (`user_no`) USING BTREE,
  KEY `IDX_ultary_pet_profile_file_id` (`profile_file_id`) USING BTREE,
  KEY `IDX_ultary_pet_is_deleted` (`is_deleted`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사용자가 등록한 반려동물 프로필 (@mention_id)';

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
  `deleted_by_user_no` INT(11) NULL DEFAULT NULL COMMENT '실제 삭제한 사용자 (작성자 또는 COLLABORATOR 펫 보호자)',
  PRIMARY KEY (`feed_id`) USING BTREE,
  KEY `IDX_ultary_feed_user_created` (`user_no`, `created_at`) USING BTREE,
  KEY `IDX_ultary_feed_visibility_created` (`visibility`, `created_at`) USING BTREE,
  KEY `IDX_ultary_feed_is_deleted_created` (`is_deleted`, `created_at`) USING BTREE,
  KEY `IDX_ultary_feed_deleted_by_user_no` (`deleted_by_user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='반려동물 일상 피드';

CREATE TABLE `ultary_feed_pet` (
  `feed_pet_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `pet_id` INT(11) NOT NULL COMMENT '피드에 등장/공동 작성하는 반려동물',
  `added_by_user_no` INT(11) NOT NULL COMMENT '반려동물을 피드에 추가한 사용자',
  `role` ENUM('TAGGED','COLLABORATOR') NOT NULL DEFAULT 'TAGGED' COMMENT 'TAGGED=등장(참고), COLLABORATOR=공동작성(멘션된 피드·삭제권한)',
  `is_main` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '피드 대표 반려동물 여부',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`feed_pet_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_pet_feed_pet` (`feed_id`, `pet_id`) USING BTREE,
  KEY `IDX_ultary_feed_pet_pet_id` (`pet_id`) USING BTREE,
  KEY `IDX_ultary_feed_pet_added_by_user_no` (`added_by_user_no`) USING BTREE,
  KEY `IDX_ultary_feed_pet_role` (`role`) USING BTREE,
  KEY `IDX_ultary_feed_pet_role_pet` (`role`, `pet_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드 반려동물 등장/공동작성 (승인 없음)';

CREATE TABLE `ultary_feed_media` (
  `feed_media_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `file_id` INT(11) NOT NULL COMMENT '원본 미디어 파일 (이미지 또는 영상)',
  `media_type` ENUM('IMAGE','VIDEO') NOT NULL COMMENT '캐러셀 슬롯 타입',
  `thumbnail_file_id` INT(11) NULL DEFAULT NULL COMMENT 'VIDEO 커버/썸네일 이미지. IMAGE면 NULL',
  `duration_sec` INT(11) NULL DEFAULT NULL COMMENT 'VIDEO 재생 초. IMAGE면 NULL',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '캐러셀 순서 (0부터)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`feed_media_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_media_sort` (`feed_id`, `sort_order`) USING BTREE,
  KEY `IDX_ultary_feed_media_file_id` (`file_id`) USING BTREE,
  KEY `IDX_ultary_feed_media_thumbnail_file_id` (`thumbnail_file_id`) USING BTREE,
  KEY `IDX_ultary_feed_media_type` (`media_type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드 미디어 캐러셀 (사진/짧은 영상 여러 개)';

CREATE TABLE `ultary_feed_media_mention` (
  `feed_media_mention_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_media_id` INT(11) NOT NULL COMMENT '멘션이 붙은 캐러셀 슬롯(주로 IMAGE)',
  `pet_id` INT(11) NOT NULL COMMENT '@mention_id 대상 반려동물',
  `pos_x` DECIMAL(5,2) NOT NULL COMMENT '가로 위치 % (0.00~100.00)',
  `pos_y` DECIMAL(5,2) NOT NULL COMMENT '세로 위치 % (0.00~100.00)',
  `added_by_user_no` INT(11) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feed_media_mention_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_media_mention_pet` (`feed_media_id`, `pet_id`) USING BTREE,
  KEY `IDX_ultary_feed_media_mention_pet_id` (`pet_id`) USING BTREE,
  KEY `IDX_ultary_feed_media_mention_added_by` (`added_by_user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='미디어(이미지) 위 @반려동물 위치 멘션 (승인 없음)';

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
  `hashtag` VARCHAR(30) NOT NULL COMMENT '# 뒤에 쓰는 키. 중복 허용 (검색 후 선택). 생성 후 변경 불가',
  `title` VARCHAR(100) NULL DEFAULT NULL COMMENT '상품명/소개 제목 (길 수 있음). 단순 해시태그는 NULL',
  `handle` VARCHAR(30) NULL DEFAULT NULL COMMENT '선택 고유 코드. hashtag 중복 시 구분. 영문·숫자·_ , UNIQUE',
  `handle_changed_at` DATETIME NULL DEFAULT NULL COMMENT 'handle 최초 설정/마지막 변경 시각. NULL=handle 미설정(최초 설정 자유). 설정·변경 후 30일간 재변경 불가. 생성 시 handle을 넣으면 생성 시각으로 설정',
  `content` VARCHAR(500) NULL DEFAULT NULL COMMENT '태그 소개글',
  `link` VARCHAR(200) NULL DEFAULT NULL COMMENT '상품/외부 링크',
  `use_count` INT(11) NOT NULL DEFAULT 0,
  `created_by_user_no` INT(11) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`tag_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_tag_handle` (`handle`) USING BTREE,
  KEY `IDX_ultary_tag_hashtag` (`hashtag`) USING BTREE,
  KEY `IDX_ultary_tag_created_by_user_no` (`created_by_user_no`) USING BTREE,
  KEY `IDX_ultary_tag_is_deleted` (`is_deleted`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='해시태그/상품·소개 태그 (#hashtag 불변, 선택 handle)';

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

CREATE TABLE `ultary_user_search_history` (
  `user_search_history_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_no` INT(11) NOT NULL COMMENT '검색한 사용자',
  `search_type` ENUM('NICKNAME','PET','TAG') NOT NULL COMMENT '검색 결과 종류',
  `target_user_no` INT(11) NULL DEFAULT NULL COMMENT 'search_type=NICKNAME',
  `target_pet_id` INT(11) NULL DEFAULT NULL COMMENT 'search_type=PET',
  `target_tag_id` INT(11) NULL DEFAULT NULL COMMENT 'search_type=TAG',
  `keyword` VARCHAR(50) NULL DEFAULT NULL COMMENT '검색 당시 표시용 스냅샷 (닉네임/mention_id/hashtag)',
  `searched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '동일 대상 재검색 시 갱신',
  PRIMARY KEY (`user_search_history_id`) USING BTREE,
  KEY `IDX_ultary_user_search_user_time` (`user_no`, `searched_at`) USING BTREE,
  KEY `IDX_ultary_user_search_type` (`user_no`, `search_type`) USING BTREE,
  KEY `IDX_ultary_user_search_target_user` (`target_user_no`) USING BTREE,
  KEY `IDX_ultary_user_search_target_pet` (`target_pet_id`) USING BTREE,
  KEY `IDX_ultary_user_search_target_tag` (`target_tag_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='유저별 최근 검색 (닉네임/펫/태그). user 테이블 컬럼이 아니라 이력 테이블';

CREATE TABLE `ultary_notification` (
  `notification_id` INT(11) NOT NULL AUTO_INCREMENT,
  `receiver_user_no` INT(11) NOT NULL COMMENT '알림을 받는 사용자',
  `actor_user_no` INT(11) NULL DEFAULT NULL COMMENT '알림을 발생시킨 사용자. 시스템 알림이면 null 가능',
  `type` ENUM('FEED_LIKE','FEED_COMMENT','FEED_REPLY','MENTION','NEIGHBOR_REQUEST','NEIGHBOR_ACCEPTED','FEED_COLLABORATOR','SYSTEM') NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='좋아요, 댓글, 답글, 멘션, 이웃, 공동작성 알림';

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

CREATE TABLE `ultary_story` (
  `story_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_no` INT(11) NOT NULL COMMENT '스토리 작성자',
  `file_id` INT(11) NOT NULL COMMENT '원본 미디어 (이미지 또는 짧은 영상)',
  `media_type` ENUM('IMAGE','VIDEO') NOT NULL,
  `thumbnail_file_id` INT(11) NULL DEFAULT NULL COMMENT 'VIDEO 커버. IMAGE면 NULL',
  `duration_sec` INT(11) NULL DEFAULT NULL COMMENT 'VIDEO 재생 초(최대 60). IMAGE면 NULL',
  `caption` VARCHAR(200) NULL DEFAULT NULL COMMENT '짧은 문구',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '업로드 시각 (UI 표시)',
  `expires_at` DATETIME NOT NULL COMMENT 'created_at + 24시간. 이후 비활성',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`story_id`) USING BTREE,
  KEY `IDX_ultary_story_user_expires` (`user_no`, `expires_at`) USING BTREE,
  KEY `IDX_ultary_story_expires_deleted` (`expires_at`, `is_deleted`) USING BTREE,
  KEY `IDX_ultary_story_file_id` (`file_id`) USING BTREE,
  KEY `IDX_ultary_story_thumbnail_file_id` (`thumbnail_file_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='24시간 스토리 (사진/짧은 영상)';

CREATE TABLE `ultary_story_view` (
  `story_view_id` INT(11) NOT NULL AUTO_INCREMENT,
  `story_id` INT(11) NOT NULL,
  `viewer_user_no` INT(11) NOT NULL COMMENT '스토리를 본 사용자',
  `viewed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`story_view_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_story_view_story_viewer` (`story_id`, `viewer_user_no`) USING BTREE,
  KEY `IDX_ultary_story_view_viewer` (`viewer_user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='스토리 읽음(시청) 기록';

ALTER TABLE `ultary_user`
  ADD CONSTRAINT `FK_user_profile_file` FOREIGN KEY (`profile_file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_user_social`
  ADD CONSTRAINT `FK_user_social_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;

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
  ADD CONSTRAINT `FK_feed_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_deleted_by_user` FOREIGN KEY (`deleted_by_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_feed_pet`
  ADD CONSTRAINT `FK_feed_pet_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_pet_pet` FOREIGN KEY (`pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_pet_added_user` FOREIGN KEY (`added_by_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_media`
  ADD CONSTRAINT `FK_feed_media_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_media_file` FOREIGN KEY (`file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_media_thumbnail_file` FOREIGN KEY (`thumbnail_file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_feed_media_mention`
  ADD CONSTRAINT `FK_feed_media_mention_media` FOREIGN KEY (`feed_media_id`) REFERENCES `ultary_feed_media` (`feed_media_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_media_mention_pet` FOREIGN KEY (`pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_media_mention_added_user` FOREIGN KEY (`added_by_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

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

ALTER TABLE `ultary_user_search_history`
  ADD CONSTRAINT `FK_user_search_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_user_search_target_user` FOREIGN KEY (`target_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_user_search_target_pet` FOREIGN KEY (`target_pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_user_search_target_tag` FOREIGN KEY (`target_tag_id`) REFERENCES `ultary_tag` (`tag_id`) ON UPDATE CASCADE ON DELETE CASCADE;

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

ALTER TABLE `ultary_story`
  ADD CONSTRAINT `FK_story_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_story_file` FOREIGN KEY (`file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_story_thumbnail_file` FOREIGN KEY (`thumbnail_file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_story_view`
  ADD CONSTRAINT `FK_story_view_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_story_view_viewer` FOREIGN KEY (`viewer_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;
