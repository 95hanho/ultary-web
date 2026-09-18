-- ============================================================
-- ULTARY 로컬/개발용 샘플 데이터 (schema_version 7)
-- 실행: share/database/schema/.../001_init_schema.sql 이후. 운영에서는 실행하지 않음.
-- 재실행: CLEANUP 후 INSERT (그대로 다시 실행 가능).
--
-- 실제 업로드 파일 (UPLOAD_DIR, 예: D:/files/ultary-api):
--   images/3a0deb13-37ce-4335-8db9-b88d645434b4.jpg
--   images/237977e1-02ad-41ba-985c-90c94d004bfd.jpg
--   images/a4cf9263-4807-4679-96d5-c2a74be9437a.png
--   images/ec188795-ad0f-4f76-9d92-5a1df48550d3.jpg
--   videos/c7c8c642-4735-456d-97be-f399256a0aaf.mp4
--
-- 시드: user 101~105 (울타리/나리집사/산책러/대기중/팔로워)
--       pet 101~107, file 100~104, feed 101~102, tag 101~103, story 101~102
--       neighbor 101~104 (101↔102·103 ACCEPTED, 105→101 ACCEPTED, 104→101 PENDING)
-- HTTP: main/my-ultary/story/neighbor/feed/pet/tag → user 101 (google-myultary-test-001)
-- ============================================================

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- CLEANUP ----------
DELETE FROM `ultary_story_view`
WHERE `viewer_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `story_id` IN (1, 101, 102);

DELETE FROM `ultary_story`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `story_id` IN (1, 101, 102)
   OR `file_id` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 102, 103, 104);

DELETE FROM `ultary_feed_comment_mention`
WHERE `feed_comment_id` IN (1, 101)
   OR `feed_reply_id` IN (1, 101)
   OR `mentioned_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `mentioned_pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `feed_comment_mention_id` IN (1, 2, 3, 101, 102, 103);

DELETE FROM `ultary_feed_reply`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `feed_reply_id` IN (1, 101)
   OR `feed_comment_id` IN (1, 101);

DELETE FROM `ultary_feed_comment`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `feed_comment_id` IN (1, 101)
   OR `feed_id` IN (1, 2, 101, 102);

DELETE FROM `ultary_feed_store`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `feed_id` IN (1, 2, 101, 102);

DELETE FROM `ultary_feed_like`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `feed_id` IN (1, 2, 101, 102);

DELETE FROM `ultary_feed_tag`
WHERE `feed_id` IN (1, 2, 101, 102)
   OR `tag_id` IN (1, 2, 3, 101, 102, 103);

DELETE FROM `ultary_tag_image`
WHERE `tag_id` IN (1, 2, 3, 101, 102, 103)
   OR `file_id` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 102, 103, 104);

DELETE FROM `ultary_feed_media_mention`
WHERE `feed_media_id` IN (1, 2, 3, 101, 102, 103)
   OR `pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `added_by_user_no` IN (1, 2, 101, 102, 103, 104, 105);

DELETE FROM `ultary_feed_media`
WHERE `feed_id` IN (1, 2, 101, 102)
   OR `file_id` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 102, 103, 104)
   OR `thumbnail_file_id` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 102, 103, 104);

DELETE FROM `ultary_feed_pet`
WHERE `feed_id` IN (1, 2, 101, 102)
   OR `pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `added_by_user_no` IN (1, 2, 101, 102, 103, 104, 105);

DELETE FROM `ultary_feed`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `feed_id` IN (1, 2, 101, 102);

DELETE FROM `ultary_user_block`
WHERE `blocker_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `blocked_user_no` IN (1, 2, 101, 102, 103, 104, 105);

DELETE FROM `ultary_neighbor`
WHERE `neighbor_id` IN (1, 101, 102, 103, 104, 105)
   OR `requester_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `receiver_user_no` IN (1, 2, 101, 102, 103, 104, 105);

DELETE FROM `ultary_tag`
WHERE `tag_id` IN (1, 2, 3, 101, 102, 103)
   OR `created_by_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `handle` IN ('royal_canin_01');

DELETE FROM `ultary_pet`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `mention_id` IN ('choco_01', 'nabi_01', 'mung_01', 'coco_01', 'tori_01', 'kong_01', 'bori_01');

DELETE FROM `ultary_token`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105);

DELETE FROM `ultary_user_social`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `provider_user_id` IN (
     'google-seed-user-001',
     'kakao-seed-user-002',
     'google-myultary-test-001',
     'kakao-seed-neighbor-102',
     'google-seed-user-103',
     'google-seed-user-104',
     'kakao-seed-user-105'
   );

UPDATE `ultary_user` SET `profile_file_id` = NULL
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `email` IN (
     'seed.dog@example.com',
     'seed.cat@example.com',
     'myultary.test@example.com',
     'seed.neighbor@example.com',
     'seed.u103@example.com',
     'seed.u104@example.com',
     'seed.u105@example.com'
   );

DELETE FROM `ultary_file`
WHERE `file_id` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101, 102, 103, 104)
   OR `store_name` IN (
     '3a0deb13-37ce-4335-8db9-b88d645434b4.jpg',
     '237977e1-02ad-41ba-985c-90c94d004bfd.jpg',
     'a4cf9263-4807-4679-96d5-c2a74be9437a.png',
     'ec188795-ad0f-4f76-9d92-5a1df48550d3.jpg',
     'c7c8c642-4735-456d-97be-f399256a0aaf.mp4',
     'seed-user1-profile.jpg',
     'seed-user2-profile.jpg',
     'seed-choco.jpg',
     'seed-nabi.jpg',
     'seed-feed1-1.jpg',
     'seed-feed1-2.jpg',
     'seed-feed2-1.jpg',
     'seed-tag-royal.jpg',
     'seed-story1.jpg'
   );

DELETE FROM `ultary_user`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `email` IN (
     'seed.dog@example.com',
     'seed.cat@example.com',
     'myultary.test@example.com',
     'seed.neighbor@example.com',
     'seed.u103@example.com',
     'seed.u104@example.com',
     'seed.u105@example.com'
   )
   OR `nickname` IN (
     '울타리견주', '울타리냥이', '울타리', '나리집사',
     '산책러', '대기중', '팔로워'
   );

SET FOREIGN_KEY_CHECKS = 1;

-- ---------- 사용자 5명 (비밀번호: {noop}Test1234!) ----------
INSERT INTO `ultary_user` (
  `user_no`, `password`, `name`, `nickname`, `nickname_changed_at`,
  `is_default_nickname`, `email`, `phone`, `bio`,
  `region_sido`, `region_sigungu`, `withdrawal_status`
) VALUES
(101, '{noop}Test1234!', '한호', '울타리', NOW(), 0, 'myultary.test@example.com', '01011112222', '강아지랑 산책하는 집사', '서울특별시', '마포구', 'ACTIVE'),
(102, '{noop}Test1234!', '나리', '나리집사', NOW(), 0, 'seed.neighbor@example.com', '01033334444', '고양이 집사', '서울특별시', '용산구', 'ACTIVE'),
(103, '{noop}Test1234!', '민수', '산책러', NOW(), 0, 'seed.u103@example.com', '01055556666', '주말 산책러', '경기도', '성남시', 'ACTIVE'),
(104, '{noop}Test1234!', '지우', '대기중', NOW(), 0, 'seed.u104@example.com', '01077778888', '요청 대기 중', '서울특별시', '강남구', 'ACTIVE'),
(105, '{noop}Test1234!', '서연', '팔로워', NOW(), 0, 'seed.u105@example.com', '01099990000', '101의 이웃', '부산광역시', '해운대구', 'ACTIVE');

INSERT INTO `ultary_user_social` (
  `user_no`, `provider`, `provider_user_id`, `provider_email`
) VALUES
(101, 'GOOGLE', 'google-myultary-test-001', 'myultary.test@example.com'),
(102, 'KAKAO', 'kakao-seed-neighbor-102', 'seed.neighbor@example.com'),
(103, 'GOOGLE', 'google-seed-user-103', 'seed.u103@example.com'),
(104, 'GOOGLE', 'google-seed-user-104', 'seed.u104@example.com'),
(105, 'KAKAO', 'kakao-seed-user-105', 'seed.u105@example.com');

-- ---------- 파일 5개 (디스크 실파일) ----------
INSERT INTO `ultary_file` (
  `file_id`, `original_name`, `store_name`, `extension`, `mime_type`,
  `file_size`, `file_path`, `uploaded_by_user_no`, `created_at`, `is_deleted`
) VALUES
(100, 'sample.jpg', '3a0deb13-37ce-4335-8db9-b88d645434b4.jpg', 'jpg', 'image/jpeg', 450,
 'images/3a0deb13-37ce-4335-8db9-b88d645434b4.jpg', 101, NOW(), 0),
(101, 'sample2.jpg', '237977e1-02ad-41ba-985c-90c94d004bfd.jpg', 'jpg', 'image/jpeg', 450,
 'images/237977e1-02ad-41ba-985c-90c94d004bfd.jpg', 102, NOW(), 0),
(102, 'sample.png', 'a4cf9263-4807-4679-96d5-c2a74be9437a.png', 'png', 'image/png', 70,
 'images/a4cf9263-4807-4679-96d5-c2a74be9437a.png', 101, NOW(), 0),
(103, 'sample3.jpg', 'ec188795-ad0f-4f76-9d92-5a1df48550d3.jpg', 'jpg', 'image/jpeg', 450,
 'images/ec188795-ad0f-4f76-9d92-5a1df48550d3.jpg', 103, NOW(), 0),
(104, 'sample.mp4', 'c7c8c642-4735-456d-97be-f399256a0aaf.mp4', 'mp4', 'video/mp4', 24,
 'videos/c7c8c642-4735-456d-97be-f399256a0aaf.mp4', 101, NOW(), 0);

UPDATE `ultary_user` SET `profile_file_id` = 100 WHERE `user_no` = 101;
UPDATE `ultary_user` SET `profile_file_id` = 101 WHERE `user_no` = 102;
UPDATE `ultary_user` SET `profile_file_id` = 103 WHERE `user_no` = 103;
UPDATE `ultary_user` SET `profile_file_id` = 102 WHERE `user_no` = 104;
UPDATE `ultary_user` SET `profile_file_id` = 100 WHERE `user_no` = 105;

-- ---------- 반려동물 (유저당 1~2) ----------
INSERT INTO `ultary_pet` (
  `pet_id`, `user_no`, `mention_id`, `mention_id_changed_at`, `name`,
  `species`, `breed`, `gender`, `is_neutered`, `birthday`, `profile_file_id`, `bio`
) VALUES
(101, 101, 'choco_01', NOW(), '초코', 'DOG', '푸들', 'MALE', 1, '2020-05-01 00:00:00', 102, '산책 좋아함'),
(102, 101, 'mung_01', NOW(), '멍이', 'DOG', '말티즈', 'FEMALE', 0, '2022-01-10 00:00:00', 100, '집돌이'),
(103, 102, 'nabi_01', NOW(), '나비', 'CAT', '코리안숏헤어', 'FEMALE', 1, '2021-03-15 00:00:00', 101, '캣타워 점령 중'),
(104, 103, 'coco_01', NOW(), '코코', 'DOG', '비숑', 'MALE', 1, '2019-08-20 00:00:00', 103, '공놀이'),
(105, 103, 'tori_01', NOW(), '토리', 'CAT', '러시안블루', 'MALE', 1, '2020-11-01 00:00:00', 102, '조용함'),
(106, 104, 'kong_01', NOW(), '콩이', 'DOG', '시바', 'FEMALE', 0, '2023-02-02 00:00:00', 101, '호기심 많음'),
(107, 105, 'bori_01', NOW(), '보리', 'DOG', '코기', 'MALE', 1, '2021-07-07 00:00:00', 103, '산책 필수');

-- ---------- 태그 + 태그 이미지 ----------
INSERT INTO `ultary_tag` (
  `tag_id`, `hashtag`, `title`, `handle`, `handle_changed_at`,
  `content`, `link`, `use_count`, `created_by_user_no`
) VALUES
(101, '산책', NULL, NULL, NULL, NULL, NULL, 1, 101),
(102, 'royalcanin', '로얄캐닌 어덜트', 'royal_canin_01', NOW(), '강아지 사료', 'https://example.com/product/1', 1, 101),
(103, '냥스타그램', NULL, NULL, NULL, NULL, NULL, 1, 102);

INSERT INTO `ultary_tag_image` (`tag_image_id`, `tag_id`, `file_id`, `sort_order`) VALUES
(101, 102, 103, 0);

-- ---------- 이웃 관계 ----------
-- 101→102 ACCEPTED (101 주민에 102)
-- 101→103 ACCEPTED (101 주민에 103, 스토리 owners 테스트용)
-- 105→101 ACCEPTED (101 이웃에 105)
-- 104→101 PENDING (101이 수락/거절 테스트)
INSERT INTO `ultary_neighbor` (
  `neighbor_id`, `requester_user_no`, `receiver_user_no`, `pair_key`,
  `status`, `requested_at`, `accepted_at`
) VALUES
(101, 101, 102, '101:102', 'ACCEPTED', NOW(), NOW()),
(102, 101, 103, '101:103', 'ACCEPTED', NOW(), NOW()),
(103, 105, 101, '101:105', 'ACCEPTED', NOW(), NOW()),
(104, 104, 101, '101:104', 'PENDING', NOW(), NULL);

-- ---------- 피드 101 (user 101) ----------
INSERT INTO `ultary_feed` (
  `feed_id`, `user_no`, `content`, `visibility`,
  `like_count`, `comment_count`, `store_count`
) VALUES
(101, 101, '초코랑 한강 산책 #산책', 'PUBLIC', 1, 1, 0);

INSERT INTO `ultary_feed_media` (
  `feed_media_id`, `feed_id`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `sort_order`
) VALUES
(101, 101, 100, 'IMAGE', NULL, NULL, 0),
(102, 101, 104, 'VIDEO', 103, 8, 1);

INSERT INTO `ultary_feed_media_mention` (
  `feed_media_mention_id`, `feed_media_id`, `pet_id`, `pos_x`, `pos_y`, `added_by_user_no`
) VALUES
(101, 101, 101, 42.50, 60.00, 101);

INSERT INTO `ultary_feed_pet` (
  `feed_pet_id`, `feed_id`, `pet_id`, `added_by_user_no`, `role`, `is_main`
) VALUES
(101, 101, 101, 101, 'COLLABORATOR', 1);

INSERT INTO `ultary_feed_tag` (`feed_tag_id`, `feed_id`, `tag_id`) VALUES
(101, 101, 101),
(102, 101, 102);

-- ---------- 피드 102 (user 102) ----------
INSERT INTO `ultary_feed` (
  `feed_id`, `user_no`, `content`, `visibility`,
  `like_count`, `comment_count`, `store_count`
) VALUES
(102, 102, '초코도 등장! #냥스타그램', 'PUBLIC', 1, 0, 1);

INSERT INTO `ultary_feed_media` (
  `feed_media_id`, `feed_id`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `sort_order`
) VALUES
(103, 102, 101, 'IMAGE', NULL, NULL, 0);

INSERT INTO `ultary_feed_media_mention` (
  `feed_media_mention_id`, `feed_media_id`, `pet_id`, `pos_x`, `pos_y`, `added_by_user_no`
) VALUES
(102, 103, 101, 50.00, 45.00, 102);

INSERT INTO `ultary_feed_pet` (
  `feed_pet_id`, `feed_id`, `pet_id`, `added_by_user_no`, `role`, `is_main`
) VALUES
(102, 102, 103, 102, 'TAGGED', 1),
(103, 102, 101, 102, 'COLLABORATOR', 0);

INSERT INTO `ultary_feed_tag` (`feed_tag_id`, `feed_id`, `tag_id`) VALUES
(103, 102, 103);

INSERT INTO `ultary_feed_like` (`feed_like_id`, `feed_id`, `user_no`) VALUES
(101, 101, 102),
(102, 102, 101);

INSERT INTO `ultary_feed_store` (`feed_store_id`, `feed_id`, `user_no`) VALUES
(101, 102, 101);

INSERT INTO `ultary_feed_comment` (
  `feed_comment_id`, `feed_id`, `user_no`, `content`
) VALUES
(101, 101, 102, '초코 너무 귀엽다! @울타리 @choco_01');

INSERT INTO `ultary_feed_comment_mention` (
  `feed_comment_mention_id`, `feed_comment_id`, `feed_reply_id`, `mentioned_user_no`, `mentioned_pet_id`
) VALUES
(101, 101, NULL, 101, NULL),
(102, 101, NULL, NULL, 101);

INSERT INTO `ultary_feed_reply` (
  `feed_reply_id`, `feed_comment_id`, `user_no`, `content`
) VALUES
(101, 101, 101, '고마워! @나리집사');

INSERT INTO `ultary_feed_comment_mention` (
  `feed_comment_mention_id`, `feed_comment_id`, `feed_reply_id`, `mentioned_user_no`, `mentioned_pet_id`
) VALUES
(103, NULL, 101, 102, NULL);

-- ---------- 스토리 ----------
INSERT INTO `ultary_story` (
  `story_id`, `user_no`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `caption`,
  `created_at`, `expires_at`
) VALUES
(101, 101, 100, 'IMAGE', NULL, NULL, '오늘 산책 스토리', NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR)),
(102, 103, 103, 'IMAGE', NULL, NULL, '산책러 스토리', NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR));

ALTER TABLE `ultary_user` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_file` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_pet` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_tag` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_tag_image` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_media` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_media_mention` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_pet` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_tag` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_like` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_store` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_comment` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_reply` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_comment_mention` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_story` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_neighbor` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_user_social` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_user_block` AUTO_INCREMENT = 200;
