-- schema_version: 20
-- Ultary MariaDB 10.1 초기 스키마
-- v20: ultary_user.withdrawal_status 에 SUSPENDED, suspended_at. 관리자 회원 정지
-- v19: ultary_feed_pin(울타리 고정), ultary_feed_save(나만 보는 저장). 구 ultary_feed_store·store_count
-- v18: ultary_dm_room, ultary_dm_message. 1:1 메시지. 게시글(사진 슬롯)·스토리 공유
-- v17: ultary_user_privacy. 공개 범위. 행이 없으면 비공개 계정 꺼짐, 게시글 전체, 스토리 이웃, 신청·댓글·멘션·태그 켜짐
-- v16: ultary_notification_setting. 알림 종류별 켜기/끄기. 행이 없으면 전부 켜짐
-- v15: ultary_user.withdrawal_requested_at 제거. 탈퇴는 WITHDRAWN 과 withdrawal_completed_at 만 사용
-- v14: 알림 집계(이웃신청·좋아요·댓글답글·언급·태그·스토리 공감)와 ultary_story_like
-- v13: 사진·스토리 @ 최근 펫 태그 (ultary_user_pet_tag_history). 검색 최근 울타리와 별도
-- v12: 스토리 위 글자(ultary_story_text)와 펫 멘션(ultary_story_mention)
-- v11: 유저 프로필 사진 컬럼 제거. 표시 사진은 프로필 있는 펫 중 priority가 가장 높은 것
-- v10: ultary_user_search_history 는 들어간 유저 울타리만 (user_no + target_user_no)
-- v9: ultary_feed_comment_like / ultary_feed_reply_like, 댓글·답글 like_count
-- v8: ultary_file 출처 컬럼 (source_type/author_name/source_url/license_url/copyright_notice)
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
--   - 닉네임 허용: 영문·숫자·한글. 한글만 2~5자, 영문·숫자만 4~10자. 혼합 시 한글1자=2, 영문·숫자1자=1, 가중치 합 4~10 (한글 최대 5자)
--   - mention_id / tag.handle 허용: 영문·숫자·언더바 (^[A-Za-z0-9_]{1,30}$), UNIQUE, utf8_general_ci라 대소문자 동일 취급
--   - 최근 검색: 검색어가 아니라 들어간 유저 울타리. ultary_user_search_history (user_no, target_user_no) 1행
--   - 최근 펫 태그: 스토리 @·사진 태그에서 고른 펫. ultary_user_pet_tag_history (user_no, pet_id) 1행. 검색 기록과 섞지 않음
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
--   v8: ultary_file 출처 컬럼
--   v9: 댓글·답글 좋아요 (피드 좋아요와 별도 테이블)
--   v10: 최근 검색은 유저 울타리 방문만 남김 (search_type·펫·태그·keyword 제거)
--   v11: ultary_user.profile_file_id 제거. pet.priority (작을수록 우선)로 대표 프로필 사진·펫 목록 순서
--   v12: 스토리 글자 스티커·펫 위치 멘션
--   v13: 최근 펫 태그 (검색 최근 울타리와 별 테이블)
--   v14: 알림 타입·집계 컬럼, 스토리 공감(ultary_story_like)
--   v15: ultary_user.withdrawal_requested_at 제거
--   v16: 알림 설정 (ultary_notification_setting). 종류별 스위치, 기본 켜짐
--   v17: 공개 범위 (ultary_user_privacy)
--   v18: DM (ultary_dm_room, ultary_dm_message)
--   v19: ultary_feed_pin, ultary_feed_save
--   v20: 회원 정지 SUSPENDED, suspended_at

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `ultary_ai_request_log`;
DROP TABLE IF EXISTS `ultary_report`;
DROP TABLE IF EXISTS `ultary_dm_message`;
DROP TABLE IF EXISTS `ultary_dm_room`;
DROP TABLE IF EXISTS `ultary_user_privacy`;
DROP TABLE IF EXISTS `ultary_notification_setting`;
DROP TABLE IF EXISTS `ultary_notification`;
DROP TABLE IF EXISTS `ultary_story_like`;
DROP TABLE IF EXISTS `ultary_story_mention`;
DROP TABLE IF EXISTS `ultary_story_text`;
DROP TABLE IF EXISTS `ultary_story_view`;
DROP TABLE IF EXISTS `ultary_story`;
DROP TABLE IF EXISTS `ultary_user_pet_tag_history`;
DROP TABLE IF EXISTS `ultary_user_search_history`;
DROP TABLE IF EXISTS `ultary_tag_image`;
DROP TABLE IF EXISTS `ultary_feed_tag`;
DROP TABLE IF EXISTS `ultary_tag`;
DROP TABLE IF EXISTS `ultary_feed_save`;
DROP TABLE IF EXISTS `ultary_feed_pin`;
DROP TABLE IF EXISTS `ultary_feed_comment_mention`;
DROP TABLE IF EXISTS `ultary_feed_reply_like`;
DROP TABLE IF EXISTS `ultary_feed_comment_like`;
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
  `nickname` VARCHAR(30) NOT NULL COMMENT '표시 이름. 한글 2~5 / 영문·숫자 4~10 / 혼합은 한글1=2·영문·숫자1=1 가중치 합 4~10. 소셜 가입 시 google|kakao + 랜덤영문(총 10자)',
  `nickname_changed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '닉네임 마지막 변경(또는 최초 부여) 시각. 생성 직후부터 7일간 재변경 불가',
  `is_default_nickname` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=자동 생성 닉네임(변경 유도 대상), 0=사용자가 직접 변경함',
  `email` VARCHAR(50) NULL DEFAULT NULL COMMENT '소셜에서 전달되거나 이후 등록. 비밀번호 로그인 식별자로 사용 가능',
  `phone` VARCHAR(20) NULL DEFAULT NULL COMMENT '본인인증 후 등록. 비밀번호 로그인 식별자로 사용 가능',
  `bio` VARCHAR(300) NULL DEFAULT NULL COMMENT '프로필 소개글',
  `region_sido` VARCHAR(30) NULL DEFAULT NULL COMMENT '동네 기반 기능용 시/도',
  `region_sigungu` VARCHAR(30) NULL DEFAULT NULL COMMENT '동네 기반 기능용 시/군/구',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `withdrawal_status` ENUM('ACTIVE','REQUESTED','WITHDRAWN','SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT '회원 상태. SUSPENDED=관리자 정지',
  `withdrawal_completed_at` DATETIME NULL DEFAULT NULL,
  `suspended_at` DATETIME NULL DEFAULT NULL COMMENT '회원 정지 시각. 해제하면 NULL',
  PRIMARY KEY (`user_no`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_nickname` (`nickname`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_email` (`email`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_phone` (`phone`) USING BTREE,
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
  `source_type` VARCHAR(20) NULL DEFAULT NULL COMMENT 'OWNED|UNSPLASH|AI|ETC',
  `author_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '사진 작가명·크레딧',
  `source_url` VARCHAR(500) NULL DEFAULT NULL COMMENT '원본 이미지/사진 페이지',
  `license_url` VARCHAR(500) NULL DEFAULT NULL COMMENT '라이선스 페이지',
  `copyright_notice` VARCHAR(255) NULL DEFAULT NULL COMMENT '별도 저작권 문구(있을 때만)',
  `uploaded_by_user_no` INT(11) NULL DEFAULT NULL,
  `uploaded_by_admin_no` INT(11) NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`file_id`) USING BTREE,
  KEY `IDX_ultary_file_uploaded_by_user_no` (`uploaded_by_user_no`) USING BTREE,
  KEY `IDX_ultary_file_uploaded_by_admin_no` (`uploaded_by_admin_no`) USING BTREE,
  KEY `IDX_ultary_file_is_deleted` (`is_deleted`) USING BTREE,
  KEY `IDX_ultary_file_source_type` (`source_type`) USING BTREE
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
  `priority` INT(11) NOT NULL COMMENT '작을수록 우선. 1이 가장 높음. 같은 보호자 펫 목록 순서. 사진 있는 펫 중 가장 높은 우선순위가 그 유저의 프로필 사진',
  `bio` VARCHAR(300) NULL DEFAULT NULL COMMENT '반려동물 소개글',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`pet_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_pet_mention_id` (`mention_id`) USING BTREE,
  KEY `IDX_ultary_pet_user_no` (`user_no`) USING BTREE,
  KEY `IDX_ultary_pet_user_priority` (`user_no`, `priority`, `pet_id`) USING BTREE,
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
  `pin_count` INT(11) NOT NULL DEFAULT 0 COMMENT '울타리에 고정한 사람 수',
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
  `like_count` INT(11) NOT NULL DEFAULT 0,
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
  `like_count` INT(11) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_reply_id`) USING BTREE,
  KEY `IDX_ultary_feed_reply_comment_created` (`feed_comment_id`, `created_at`) USING BTREE,
  KEY `IDX_ultary_feed_reply_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='피드 댓글의 답글';

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

CREATE TABLE `ultary_feed_pin` (
  `feed_pin_id` INT(11) NOT NULL AUTO_INCREMENT,
  `feed_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL COMMENT '울타리에 이 글을 고정한 사용자',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`feed_pin_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_feed_pin_feed_user` (`feed_id`, `user_no`) USING BTREE,
  KEY `IDX_ultary_feed_pin_user_no` (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='울타리에 보여주는 고정 게시글';

CREATE TABLE `ultary_feed_save` (
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
  `user_no` INT(11) NOT NULL COMMENT '검색 후 울타리에 들어간 사용자',
  `target_user_no` INT(11) NOT NULL COMMENT '들어간 울타리 주인',
  `searched_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '같은 울타리 재방문 시 갱신',
  PRIMARY KEY (`user_search_history_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_search_pair` (`user_no`, `target_user_no`) USING BTREE,
  KEY `IDX_ultary_user_search_user_time` (`user_no`, `searched_at`) USING BTREE,
  KEY `IDX_ultary_user_search_target_user` (`target_user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='검색에서 들어간 유저 울타리. 한 사람당 대상 유저 1행';

CREATE TABLE `ultary_user_pet_tag_history` (
  `user_pet_tag_history_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_no` INT(11) NOT NULL COMMENT '스토리 @ 또는 사진 태그에서 펫을 고른 사용자',
  `pet_id` INT(11) NOT NULL COMMENT '고른 반려동물',
  `used_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '같은 펫을 다시 고르면 이 시각만 갱신',
  PRIMARY KEY (`user_pet_tag_history_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_user_pet_tag_pair` (`user_no`, `pet_id`) USING BTREE,
  KEY `IDX_ultary_user_pet_tag_user_time` (`user_no`, `used_at`) USING BTREE,
  KEY `IDX_ultary_user_pet_tag_pet_id` (`pet_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='사진·스토리 최근 펫 태그. 검색 최근 울타리와 별도. 한 사람당 펫 1행';

CREATE TABLE `ultary_notification` (
  `notification_id` INT(11) NOT NULL AUTO_INCREMENT,
  `receiver_user_no` INT(11) NOT NULL COMMENT '알림을 받는 사용자',
  `actor_user_no` INT(11) NULL DEFAULT NULL COMMENT '가장 최근 행위자. 집계면 대표 이름',
  `type` ENUM('NEIGHBOR_REQUEST','FEED_LIKE','COMMENT_LIKE','REPLY_LIKE','FEED_COMMENT','COMMENT_MENTION','REPLY_MENTION','FEED_TAG','STORY_TAG','STORY_LIKE') NOT NULL,
  `feed_id` INT(11) NULL DEFAULT NULL,
  `feed_pet_id` INT(11) NULL DEFAULT NULL,
  `feed_comment_id` INT(11) NULL DEFAULT NULL,
  `feed_reply_id` INT(11) NULL DEFAULT NULL,
  `story_id` INT(11) NULL DEFAULT NULL,
  `neighbor_id` INT(11) NULL DEFAULT NULL,
  `content` VARCHAR(80) NULL DEFAULT NULL COMMENT '인용 텍스트 일부. 댓글·답글 통합은 최신 글로 덮어씀',
  `actor_count` INT(11) NOT NULL DEFAULT 1 COMMENT '받는 사람 제외 행위자 수. 2 이상이면 화면은 외 N명',
  `has_comment` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'FEED_COMMENT 전용. 댓글이 포함됨',
  `has_reply` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'FEED_COMMENT 전용. 답글이 포함됨',
  `group_key` VARCHAR(80) NOT NULL COMMENT '같은 대상은 1행. receiver_user_no와 UNIQUE',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '새 행위가 있으면 갱신. 목록은 이 시각 내림차순',
  PRIMARY KEY (`notification_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_notification_receiver_group` (`receiver_user_no`, `group_key`) USING BTREE,
  KEY `IDX_ultary_notification_receiver_read` (`receiver_user_no`, `is_read`, `created_at`) USING BTREE,
  KEY `IDX_ultary_notification_receiver_updated` (`receiver_user_no`, `updated_at`) USING BTREE,
  KEY `IDX_ultary_notification_actor_user_no` (`actor_user_no`) USING BTREE,
  KEY `IDX_ultary_notification_feed_id` (`feed_id`) USING BTREE,
  KEY `IDX_ultary_notification_feed_pet_id` (`feed_pet_id`) USING BTREE,
  KEY `IDX_ultary_notification_comment_id` (`feed_comment_id`) USING BTREE,
  KEY `IDX_ultary_notification_reply_id` (`feed_reply_id`) USING BTREE,
  KEY `IDX_ultary_notification_story_id` (`story_id`) USING BTREE,
  KEY `IDX_ultary_notification_neighbor_id` (`neighbor_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='이웃 신청, 좋아요, 댓글·답글, 언급, 태그, 스토리 공감. 같은 대상은 1행으로 집계';

CREATE TABLE `ultary_notification_setting` (
  `user_no` INT(11) NOT NULL COMMENT '설정 주인. 행이 없으면 알림 전부 켜짐',
  `neighbor` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '이웃 신청',
  `like_post` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '게시글 좋아요',
  `like_comment` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '댓글 좋아요',
  `like_reply` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '답글 좋아요',
  `comment_on_post` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '내 게시글 댓글',
  `reply_on_comment` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '내 댓글 답글',
  `mention` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '댓글·답글 언급',
  `tag_post` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '게시글 태그',
  `tag_story` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '스토리 태그',
  `story_react` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '스토리 공감',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='알림 종류별 수신 여부. 1=켜짐';

CREATE TABLE `ultary_user_privacy` (
  `user_no` INT(11) NOT NULL COMMENT '설정 주인. 행이 없으면 아래 기본값',
  `private_account` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1이면 전체 공개 게시글·스토리도 이웃만',
  `feed_visibility` ENUM('PUBLIC','NEIGHBORS','PRIVATE') NOT NULL DEFAULT 'PUBLIC' COMMENT '새 게시글 기본 공개 범위',
  `story_visibility` ENUM('PUBLIC','NEIGHBORS','PRIVATE') NOT NULL DEFAULT 'NEIGHBORS' COMMENT '스토리 공개 범위',
  `neighbor_request` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '이웃 신청 받기',
  `allow_comment` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '게시글 댓글·답글 허용',
  `allow_mention` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '댓글·답글 멘션 허용',
  `allow_tag` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '게시글·스토리 태그 허용',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='공개 범위. 행이 없으면 기본값';

CREATE TABLE `ultary_dm_room` (
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

CREATE TABLE `ultary_dm_message` (
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

CREATE TABLE `ultary_story_text` (
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

CREATE TABLE `ultary_story_mention` (
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

CREATE TABLE `ultary_story_like` (
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

ALTER TABLE `ultary_feed_comment_like`
  ADD CONSTRAINT `FK_feed_comment_like_comment` FOREIGN KEY (`feed_comment_id`) REFERENCES `ultary_feed_comment` (`feed_comment_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_comment_like_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_reply_like`
  ADD CONSTRAINT `FK_feed_reply_like_reply` FOREIGN KEY (`feed_reply_id`) REFERENCES `ultary_feed_reply` (`feed_reply_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_reply_like_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_comment_mention`
  ADD CONSTRAINT `FK_mention_comment` FOREIGN KEY (`feed_comment_id`) REFERENCES `ultary_feed_comment` (`feed_comment_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_mention_reply` FOREIGN KEY (`feed_reply_id`) REFERENCES `ultary_feed_reply` (`feed_reply_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_mention_user` FOREIGN KEY (`mentioned_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_mention_pet` FOREIGN KEY (`mentioned_pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_feed_pin`
  ADD CONSTRAINT `FK_feed_pin_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_pin_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_feed_save`
  ADD CONSTRAINT `FK_feed_save_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_feed_save_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

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
  ADD CONSTRAINT `FK_user_search_target_user` FOREIGN KEY (`target_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ultary_user_pet_tag_history`
  ADD CONSTRAINT `FK_user_pet_tag_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_user_pet_tag_pet` FOREIGN KEY (`pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ultary_notification`
  ADD CONSTRAINT `FK_notification_receiver` FOREIGN KEY (`receiver_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_notification_actor` FOREIGN KEY (`actor_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_feed_pet` FOREIGN KEY (`feed_pet_id`) REFERENCES `ultary_feed_pet` (`feed_pet_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_comment` FOREIGN KEY (`feed_comment_id`) REFERENCES `ultary_feed_comment` (`feed_comment_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_reply` FOREIGN KEY (`feed_reply_id`) REFERENCES `ultary_feed_reply` (`feed_reply_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_neighbor` FOREIGN KEY (`neighbor_id`) REFERENCES `ultary_neighbor` (`neighbor_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_notification_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_notification_setting`
  ADD CONSTRAINT `FK_notification_setting_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ultary_user_privacy`
  ADD CONSTRAINT `FK_user_privacy_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ultary_dm_room`
  ADD CONSTRAINT `FK_dm_room_user_low` FOREIGN KEY (`user_low`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_dm_room_user_high` FOREIGN KEY (`user_high`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE `ultary_dm_message`
  ADD CONSTRAINT `FK_dm_message_room` FOREIGN KEY (`dm_room_id`) REFERENCES `ultary_dm_room` (`dm_room_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_dm_message_sender` FOREIGN KEY (`sender_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_dm_message_feed` FOREIGN KEY (`feed_id`) REFERENCES `ultary_feed` (`feed_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_dm_message_feed_media` FOREIGN KEY (`feed_media_id`) REFERENCES `ultary_feed_media` (`feed_media_id`) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT `FK_dm_message_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_story_like`
  ADD CONSTRAINT `FK_story_like_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_story_like_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;

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

ALTER TABLE `ultary_story_text`
  ADD CONSTRAINT `FK_story_text_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE `ultary_story_mention`
  ADD CONSTRAINT `FK_story_mention_story` FOREIGN KEY (`story_id`) REFERENCES `ultary_story` (`story_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_story_mention_pet` FOREIGN KEY (`pet_id`) REFERENCES `ultary_pet` (`pet_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_story_mention_added_user` FOREIGN KEY (`added_by_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT;
