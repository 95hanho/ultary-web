-- ============================================================
-- ULTARY 로컬/개발용 샘플 데이터 (schema_version 9)
-- 실행: 001_init_schema.sql(v8) 이후. 운영에서는 실행하지 않음.
-- 재실행: CLEANUP 후 INSERT (그대로 다시 실행 가능).
--
-- CDN (Cafe24): https://ehfqntuqntu.cdn1.cafe24.com/ultary/{filename}
--   profile.jpg ~ profile5.png 은 모두 펫 프로필. profile.jpg=pet 108, profile2=pet 109
--   post.jpg, post2~4, post6 (기존 피드) + post5, post7~post15 (추가 피드, 구경 계정 제외)
--   story.png ~ story10.png (스토리 10)
--   goods.png, goods2.png (태그/상품 2)
--
-- 시드: user 101~105 / pet 101~109 / file 110~151 (CDN만. 로컬 업로드 파일은 재실행 시 삭제)
--       구경 계정 user 201~220 (피드·펫 없음, 비밀번호 Test1234!)
--       feed 101~113 (104~113은 post5·post7~15, 유저 101~105 각 2건) / story 101~110 / tag 101~103
--       피드·댓글·답글 좋아요는 구경 계정이 기존 글에 무작위로 누른 값
--       주민 102·103 스토리 각 4개 (링 테스트용 viewedByMe)
--       neighbor: 101→102·103 ACCEPTED, 105→101 ACCEPTED, 104→101 PENDING
--         알림 수락 버튼용 PENDING 추가: 105→102, 102→103, 103→104, 104→105
--       알림: user 101~105 각 15건 (구경 계정 201~220 제외). 댓글·답글 id로 이동
--       최근 검색: 101이 102~105 울타리에 각 1번 들어감
--       DM: 101↔102(안 읽음 3, 게시글·스토리 공유, 스토리+메시지), 101↔103, 101↔105
--       펫 priority: 같은 유저 안에서는 pet_id 순 (1이 가장 높음). 유저 표시 사진은 그중 사진 있는 첫 펫
-- HTTP: user 101 (google-myultary-test-001) / phone 01011112222
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- CLEANUP ----------
DELETE FROM `ultary_dm_message`
WHERE `dm_message_id` BETWEEN 101 AND 112
   OR `dm_room_id` BETWEEN 101 AND 103
   OR `sender_user_no` IN (101, 102, 103, 104, 105);

DELETE FROM `ultary_dm_room`
WHERE `dm_room_id` BETWEEN 101 AND 103
   OR `user_low` IN (101, 102, 103, 104, 105)
   OR `user_high` IN (101, 102, 103, 104, 105);

DELETE FROM `ultary_notification`
WHERE `receiver_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `actor_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `notification_id` BETWEEN 1001 AND 1099;

DELETE FROM `ultary_story_view`
WHERE `viewer_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `story_id` BETWEEN 101 AND 110
   OR `story_id` IN (1);

DELETE FROM `ultary_story`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `story_id` BETWEEN 101 AND 110
   OR `story_id` IN (1)
   OR `file_id` BETWEEN 100 AND 159
   OR `file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%')
   OR `thumbnail_file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%');

DELETE FROM `ultary_feed_comment_like`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `user_no` BETWEEN 201 AND 220
   OR `feed_comment_id` IN (1, 101)
   OR `feed_comment_id` BETWEEN 201 AND 220;

DELETE FROM `ultary_feed_reply_like`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `user_no` BETWEEN 201 AND 220
   OR `feed_reply_id` IN (1, 101)
   OR `feed_reply_id` BETWEEN 201 AND 220;

DELETE FROM `ultary_feed_comment_mention`
WHERE `feed_comment_id` IN (1, 101)
   OR `feed_comment_id` BETWEEN 201 AND 220
   OR `feed_reply_id` IN (1, 101)
   OR `feed_reply_id` BETWEEN 201 AND 220
   OR `mentioned_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `mentioned_user_no` BETWEEN 201 AND 220
   OR `mentioned_pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `feed_comment_mention_id` IN (1, 2, 3, 101, 102, 103)
   OR `feed_comment_mention_id` BETWEEN 201 AND 220;

DELETE FROM `ultary_feed_reply`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `user_no` BETWEEN 201 AND 220
   OR `feed_reply_id` IN (1, 101)
   OR `feed_reply_id` BETWEEN 201 AND 220
   OR `feed_comment_id` IN (1, 101)
   OR `feed_comment_id` BETWEEN 201 AND 220;

DELETE FROM `ultary_feed_comment`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `feed_comment_id` IN (1, 101)
   OR `feed_id` IN (1, 2, 101, 102, 103);

DELETE FROM `ultary_feed_store`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `feed_id` IN (1, 2, 101, 102, 103);

DELETE FROM `ultary_feed_like`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `user_no` BETWEEN 201 AND 220
   OR `feed_id` IN (1, 2, 101, 102, 103);

DELETE FROM `ultary_feed_tag`
WHERE `feed_id` IN (1, 2, 101, 102, 103)
   OR `tag_id` IN (1, 2, 3, 101, 102, 103);

DELETE FROM `ultary_tag_image`
WHERE `tag_id` IN (1, 2, 3, 101, 102, 103)
   OR `file_id` BETWEEN 100 AND 159
   OR `file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%');

DELETE FROM `ultary_feed_media_mention`
WHERE `feed_media_id` IN (1, 2, 3, 101, 102, 103, 104, 105)
   OR `pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `added_by_user_no` IN (1, 2, 101, 102, 103, 104, 105);

DELETE FROM `ultary_feed_media`
WHERE `feed_id` IN (1, 2, 101, 102, 103)
   OR `file_id` BETWEEN 100 AND 159
   OR `thumbnail_file_id` BETWEEN 100 AND 159
   OR `file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%')
   OR `thumbnail_file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%');

DELETE FROM `ultary_feed_pet`
WHERE `feed_id` IN (1, 2, 101, 102, 103)
   OR `pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `added_by_user_no` IN (1, 2, 101, 102, 103, 104, 105);

DELETE FROM `ultary_feed`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `feed_id` IN (1, 2, 101, 102, 103);

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
   OR `mention_id` IN ('choco_01', 'nabi_01', 'mung_01', 'coco_01', 'tori_01', 'kong_01', 'bori_01', 'dal_01', 'momo_01');

DELETE FROM `ultary_token`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `user_no` BETWEEN 201 AND 220;

DELETE FROM `ultary_user_search_history`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `user_no` BETWEEN 201 AND 220
   OR `target_user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `target_user_no` BETWEEN 201 AND 220;

DELETE FROM `ultary_user_social`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `user_no` BETWEEN 201 AND 220
   OR `provider_user_id` IN (
     'google-seed-user-001',
     'kakao-seed-user-002',
     'google-myultary-test-001',
     'kakao-seed-neighbor-102',
     'google-seed-user-103',
     'google-seed-user-104',
     'kakao-seed-user-105'
   )
   OR `provider_user_id` LIKE 'google-seed-viewer-%';

DELETE FROM `ultary_file`
WHERE `file_id` BETWEEN 100 AND 159
   OR `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%'
   OR `store_name` IN (
     'profile.jpg', 'profile2.png', 'profile3.png', 'profile4.png', 'profile5.png',
     'post.jpg', 'post2.jpg', 'post3.png', 'post4.png', 'post5.png', 'post6.png',
     'post7.png', 'post8.png', 'post9.png', 'post10.png', 'post11.png',
     'post12.png', 'post13.png', 'post14.png', 'post15.png',
     'story.png', 'story2.png', 'story3.png', 'story4.png',
     'story5.png', 'story6.png', 'story7.png', 'story8.png', 'story9.png', 'story10.png',
     'goods.png', 'goods2.png',
     '3a0deb13-37ce-4335-8db9-b88d645434b4.jpg',
     '237977e1-02ad-41ba-985c-90c94d004bfd.jpg',
     'a4cf9263-4807-4679-96d5-c2a74be9437a.png',
     'ec188795-ad0f-4f76-9d92-5a1df48550d3.jpg',
     'c7c8c642-4735-456d-97be-f399256a0aaf.mp4'
   );

DELETE FROM `ultary_user`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105)
   OR `user_no` BETWEEN 201 AND 220
   OR `email` IN (
     'seed.dog@example.com',
     'seed.cat@example.com',
     'myultary.test@example.com',
     'seed.neighbor@example.com',
     'seed.u103@example.com',
     'seed.u104@example.com',
     'seed.u105@example.com'
   )
   OR `email` LIKE 'viewer2%@example.com'
   OR `nickname` IN (
     '울타리견주', '울타리냥이', '울타리', '나리집사',
     '산책러', '대기중', '팔로워',
     '구경꾼', '산책손님', '냥덕후', '강아지팬', '한강러',
     '공원지기', '간식러', '냥집사', '멍멍이', '냥냥이',
     '구름이', '바람돌', '달빛', '별빛', '풀잎',
     '모래알', '하늘색', '노을빛', '아침이슬', '저녁노을'
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

-- ---------- 구경 계정 20명 (피드·펫 없음, 비밀번호: {noop}Test1234!) ----------
INSERT INTO `ultary_user` (
  `user_no`, `password`, `name`, `nickname`, `nickname_changed_at`,
  `is_default_nickname`, `email`, `phone`, `bio`,
  `region_sido`, `region_sigungu`, `withdrawal_status`
) VALUES
(201, '{noop}Test1234!', '구경일', '구경꾼',   NOW(), 0, 'viewer201@example.com', '01020100201', '피드 없이 구경만', '서울특별시', '마포구', 'ACTIVE'),
(202, '{noop}Test1234!', '구경이', '산책손님', NOW(), 0, 'viewer202@example.com', '01020100202', '피드 없이 구경만', '서울특별시', '용산구', 'ACTIVE'),
(203, '{noop}Test1234!', '구경삼', '냥덕후',   NOW(), 0, 'viewer203@example.com', '01020100203', '피드 없이 구경만', '서울특별시', '강남구', 'ACTIVE'),
(204, '{noop}Test1234!', '구경사', '강아지팬', NOW(), 0, 'viewer204@example.com', '01020100204', '피드 없이 구경만', '경기도', '성남시', 'ACTIVE'),
(205, '{noop}Test1234!', '구경오', '한강러',   NOW(), 0, 'viewer205@example.com', '01020100205', '피드 없이 구경만', '서울특별시', '영등포구', 'ACTIVE'),
(206, '{noop}Test1234!', '구경육', '공원지기', NOW(), 0, 'viewer206@example.com', '01020100206', '피드 없이 구경만', '경기도', '고양시', 'ACTIVE'),
(207, '{noop}Test1234!', '구경칠', '간식러',   NOW(), 0, 'viewer207@example.com', '01020100207', '피드 없이 구경만', '인천광역시', '연수구', 'ACTIVE'),
(208, '{noop}Test1234!', '구경팔', '냥집사',   NOW(), 0, 'viewer208@example.com', '01020100208', '피드 없이 구경만', '서울특별시', '성동구', 'ACTIVE'),
(209, '{noop}Test1234!', '구경구', '멍멍이',   NOW(), 0, 'viewer209@example.com', '01020100209', '피드 없이 구경만', '부산광역시', '해운대구', 'ACTIVE'),
(210, '{noop}Test1234!', '구경십', '냥냥이',   NOW(), 0, 'viewer210@example.com', '01020100210', '피드 없이 구경만', '대구광역시', '수성구', 'ACTIVE'),
(211, '{noop}Test1234!', '구경십일', '구름이', NOW(), 0, 'viewer211@example.com', '01020100211', '피드 없이 구경만', '서울특별시', '종로구', 'ACTIVE'),
(212, '{noop}Test1234!', '구경십이', '바람돌', NOW(), 0, 'viewer212@example.com', '01020100212', '피드 없이 구경만', '경기도', '수원시', 'ACTIVE'),
(213, '{noop}Test1234!', '구경십삼', '달빛',   NOW(), 0, 'viewer213@example.com', '01020100213', '피드 없이 구경만', '서울특별시', '송파구', 'ACTIVE'),
(214, '{noop}Test1234!', '구경십사', '별빛',   NOW(), 0, 'viewer214@example.com', '01020100214', '피드 없이 구경만', '대전광역시', '유성구', 'ACTIVE'),
(215, '{noop}Test1234!', '구경십오', '풀잎',   NOW(), 0, 'viewer215@example.com', '01020100215', '피드 없이 구경만', '광주광역시', '동구', 'ACTIVE'),
(216, '{noop}Test1234!', '구경십육', '모래알', NOW(), 0, 'viewer216@example.com', '01020100216', '피드 없이 구경만', '제주특별자치도', '제주시', 'ACTIVE'),
(217, '{noop}Test1234!', '구경십칠', '하늘색', NOW(), 0, 'viewer217@example.com', '01020100217', '피드 없이 구경만', '서울특별시', '관악구', 'ACTIVE'),
(218, '{noop}Test1234!', '구경십팔', '노을빛', NOW(), 0, 'viewer218@example.com', '01020100218', '피드 없이 구경만', '경기도', '용인시', 'ACTIVE'),
(219, '{noop}Test1234!', '구경십구', '아침이슬', NOW(), 0, 'viewer219@example.com', '01020100219', '피드 없이 구경만', '강원특별자치도', '춘천시', 'ACTIVE'),
(220, '{noop}Test1234!', '구경이십', '저녁노을', NOW(), 0, 'viewer220@example.com', '01020100220', '피드 없이 구경만', '경상남도', '창원시', 'ACTIVE');

INSERT INTO `ultary_user_social` (
  `user_no`, `provider`, `provider_user_id`, `provider_email`
) VALUES
(201, 'GOOGLE', 'google-seed-viewer-201', 'viewer201@example.com'),
(202, 'GOOGLE', 'google-seed-viewer-202', 'viewer202@example.com'),
(203, 'GOOGLE', 'google-seed-viewer-203', 'viewer203@example.com'),
(204, 'GOOGLE', 'google-seed-viewer-204', 'viewer204@example.com'),
(205, 'GOOGLE', 'google-seed-viewer-205', 'viewer205@example.com'),
(206, 'GOOGLE', 'google-seed-viewer-206', 'viewer206@example.com'),
(207, 'GOOGLE', 'google-seed-viewer-207', 'viewer207@example.com'),
(208, 'GOOGLE', 'google-seed-viewer-208', 'viewer208@example.com'),
(209, 'GOOGLE', 'google-seed-viewer-209', 'viewer209@example.com'),
(210, 'GOOGLE', 'google-seed-viewer-210', 'viewer210@example.com'),
(211, 'GOOGLE', 'google-seed-viewer-211', 'viewer211@example.com'),
(212, 'GOOGLE', 'google-seed-viewer-212', 'viewer212@example.com'),
(213, 'GOOGLE', 'google-seed-viewer-213', 'viewer213@example.com'),
(214, 'GOOGLE', 'google-seed-viewer-214', 'viewer214@example.com'),
(215, 'GOOGLE', 'google-seed-viewer-215', 'viewer215@example.com'),
(216, 'GOOGLE', 'google-seed-viewer-216', 'viewer216@example.com'),
(217, 'GOOGLE', 'google-seed-viewer-217', 'viewer217@example.com'),
(218, 'GOOGLE', 'google-seed-viewer-218', 'viewer218@example.com'),
(219, 'GOOGLE', 'google-seed-viewer-219', 'viewer219@example.com'),
(220, 'GOOGLE', 'google-seed-viewer-220', 'viewer220@example.com');

-- ---------- CDN 파일 22개 ----------
-- file_path = 절대 URL (FE가 그대로 표시). source_type=OWNED (Cafe24 CDN 테스트 자산)
INSERT INTO `ultary_file` (
  `file_id`, `original_name`, `store_name`, `extension`, `mime_type`,
  `file_size`, `file_path`, `source_type`,
  `uploaded_by_user_no`, `created_at`, `is_deleted`
) VALUES
-- 유저 프로필 110~114
(110, 'profile.jpg',  'profile.jpg',  'jpg', 'image/jpeg', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile.jpg',  'OWNED', 101, NOW(), 0),
(111, 'profile2.png', 'profile2.png', 'png', 'image/png',  0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile2.png', 'OWNED', 102, NOW(), 0),
(112, 'profile3.png', 'profile3.png', 'png', 'image/png',  0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile3.png', 'OWNED', 103, NOW(), 0),
(113, 'profile4.png', 'profile4.png', 'png', 'image/png',  0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile4.png', 'OWNED', 104, NOW(), 0),
(114, 'profile5.png', 'profile5.png', 'png', 'image/png',  0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile5.png', 'OWNED', 105, NOW(), 0),
-- 피드 120~124
(120, 'post.jpg',  'post.jpg',  'jpg', 'image/jpeg', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post.jpg',  'OWNED', 101, NOW(), 0),
(121, 'post2.jpg', 'post2.jpg', 'jpg', 'image/jpeg', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post2.jpg', 'OWNED', 101, NOW(), 0),
(122, 'post3.png', 'post3.png', 'png', 'image/png',  0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post3.png', 'OWNED', 102, NOW(), 0),
(123, 'post4.png', 'post4.png', 'png', 'image/png',  0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post4.png', 'OWNED', 103, NOW(), 0),
(124, 'post6.png', 'post6.png', 'png', 'image/png',  0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post6.png', 'OWNED', 102, NOW(), 0),
(142, 'post5.png',  'post5.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post5.png',  'OWNED', 101, NOW(), 0),
(143, 'post7.png',  'post7.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post7.png',  'OWNED', 101, NOW(), 0),
(144, 'post8.png',  'post8.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post8.png',  'OWNED', 102, NOW(), 0),
(145, 'post9.png',  'post9.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post9.png',  'OWNED', 102, NOW(), 0),
(146, 'post10.png', 'post10.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post10.png', 'OWNED', 103, NOW(), 0),
(147, 'post11.png', 'post11.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post11.png', 'OWNED', 103, NOW(), 0),
(148, 'post12.png', 'post12.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post12.png', 'OWNED', 104, NOW(), 0),
(149, 'post13.png', 'post13.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post13.png', 'OWNED', 104, NOW(), 0),
(150, 'post14.png', 'post14.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post14.png', 'OWNED', 105, NOW(), 0),
(151, 'post15.png', 'post15.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post15.png', 'OWNED', 105, NOW(), 0),
-- 스토리 130~139 (story.png ~ story10.png)
(130, 'story.png',   'story.png',   'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story.png',   'OWNED', 101, NOW(), 0),
(131, 'story2.png',  'story2.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story2.png',  'OWNED', 102, NOW(), 0),
(132, 'story3.png',  'story3.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story3.png',  'OWNED', 103, NOW(), 0),
(133, 'story4.png',  'story4.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story4.png',  'OWNED', 105, NOW(), 0),
(134, 'story5.png',  'story5.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story5.png',  'OWNED', 102, NOW(), 0),
(135, 'story6.png',  'story6.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story6.png',  'OWNED', 102, NOW(), 0),
(136, 'story7.png',  'story7.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story7.png',  'OWNED', 102, NOW(), 0),
(137, 'story8.png',  'story8.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story8.png',  'OWNED', 103, NOW(), 0),
(138, 'story9.png',  'story9.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story9.png',  'OWNED', 103, NOW(), 0),
(139, 'story10.png', 'story10.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story10.png', 'OWNED', 103, NOW(), 0),
-- 태그/상품 140~141
(140, 'goods.png',  'goods.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods.png',  'OWNED', 101, NOW(), 0),
(141, 'goods2.png', 'goods2.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods2.png', 'OWNED', 102, NOW(), 0);

-- ---------- 반려동물 (priority 작을수록 우선. 유저 표시 사진은 그중 프로필 있는 첫 펫) ----------
INSERT INTO `ultary_pet` (
  `pet_id`, `user_no`, `mention_id`, `mention_id_changed_at`, `name`,
  `species`, `breed`, `gender`, `is_neutered`, `birthday`, `profile_file_id`, `priority`, `bio`
) VALUES
(101, 101, 'choco_01', NOW(), '초코', 'DOG', '푸들', 'MALE', 1, '2020-05-01 00:00:00', 120, 1, '산책 좋아함'),
(102, 101, 'mung_01', NOW(), '멍이', 'DOG', '말티즈', 'FEMALE', 0, '2022-01-10 00:00:00', 121, 2, '집돌이'),
(103, 102, 'nabi_01', NOW(), '나비', 'CAT', '코리안숏헤어', 'FEMALE', 1, '2021-03-15 00:00:00', 122, 1, '캣타워 점령 중'),
(104, 103, 'coco_01', NOW(), '코코', 'DOG', '비숑', 'MALE', 1, '2019-08-20 00:00:00', 123, 1, '공놀이'),
(105, 103, 'tori_01', NOW(), '토리', 'CAT', '러시안블루', 'MALE', 1, '2020-11-01 00:00:00', 112, 2, '조용함'),
(106, 104, 'kong_01', NOW(), '콩이', 'DOG', '시바', 'FEMALE', 0, '2023-02-02 00:00:00', 113, 1, '호기심 많음'),
(107, 105, 'bori_01', NOW(), '보리', 'DOG', '코기', 'MALE', 1, '2021-07-07 00:00:00', 114, 1, '산책 필수'),
(108, 101, 'dal_01', NOW(), '달이', 'DOG', '포메라니안', 'FEMALE', 0, '2024-04-04 00:00:00', 110, 3, 'profile.jpg'),
(109, 102, 'momo_01', NOW(), '모모', 'CAT', '스코티시폴드', 'FEMALE', 1, '2023-09-09 00:00:00', 111, 2, 'profile2.png');

-- ---------- 태그 + 상품 이미지 ----------
INSERT INTO `ultary_tag` (
  `tag_id`, `hashtag`, `title`, `handle`, `handle_changed_at`,
  `content`, `link`, `use_count`, `created_by_user_no`
) VALUES
(101, '산책', NULL, NULL, NULL, NULL, NULL, 2, 101),
(102, 'royalcanin', '로얄캐닌 어덜트', 'royal_canin_01', NOW(), '강아지 사료', 'https://example.com/product/1', 1, 101),
(103, '냥스타그램', '냥이 일상', NULL, NULL, '고양이 피드용', NULL, 1, 102);

INSERT INTO `ultary_tag_image` (`tag_image_id`, `tag_id`, `file_id`, `sort_order`) VALUES
(101, 102, 140, 0),
(102, 103, 141, 0);

-- ---------- 이웃 ----------
INSERT INTO `ultary_neighbor` (
  `neighbor_id`, `requester_user_no`, `receiver_user_no`, `pair_key`,
  `status`, `requested_at`, `accepted_at`
) VALUES
(101, 101, 102, '101:102', 'ACCEPTED', NOW(), NOW()),
(102, 101, 103, '101:103', 'ACCEPTED', NOW(), NOW()),
(103, 105, 101, '101:105', 'ACCEPTED', NOW(), NOW()),
(104, 104, 101, '101:104', 'PENDING', NOW(), NULL),
(105, 105, 102, '102:105', 'PENDING', NOW(), NULL),
(106, 102, 103, '102:103', 'PENDING', NOW(), NULL),
(107, 103, 104, '103:104', 'PENDING', NOW(), NULL),
(108, 104, 105, '104:105', 'PENDING', NOW(), NULL);

-- ---------- 피드 101 (user 101 · 캐러셀 2장 + 상품태그) ----------
INSERT INTO `ultary_feed` (
  `feed_id`, `user_no`, `content`, `visibility`,
  `like_count`, `comment_count`, `store_count`
) VALUES
(101, 101, '초코랑 한강 산책 #산책 #royalcanin', 'PUBLIC', 1, 1, 0);

INSERT INTO `ultary_feed_media` (
  `feed_media_id`, `feed_id`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `sort_order`
) VALUES
(101, 101, 120, 'IMAGE', NULL, NULL, 0),
(102, 101, 121, 'IMAGE', NULL, NULL, 1);

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
(103, 102, 122, 'IMAGE', NULL, NULL, 0),
(104, 102, 124, 'IMAGE', NULL, NULL, 1);

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

-- ---------- 피드 103 (user 103 · 주민 타임라인) ----------
INSERT INTO `ultary_feed` (
  `feed_id`, `user_no`, `content`, `visibility`,
  `like_count`, `comment_count`, `store_count`
) VALUES
(103, 103, '주말 공원 산책 #산책', 'PUBLIC', 0, 0, 0);

INSERT INTO `ultary_feed_media` (
  `feed_media_id`, `feed_id`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `sort_order`
) VALUES
(105, 103, 123, 'IMAGE', NULL, NULL, 0);

INSERT INTO `ultary_feed_pet` (
  `feed_pet_id`, `feed_id`, `pet_id`, `added_by_user_no`, `role`, `is_main`
) VALUES
(104, 103, 104, 103, 'COLLABORATOR', 1);

INSERT INTO `ultary_feed_tag` (`feed_tag_id`, `feed_id`, `tag_id`) VALUES
(104, 103, 101);

-- ---------- 추가 피드 104~113 (연결 안 된 post5·post7~15, 유저 101~105 각 2건. 구경 계정 제외) ----------
INSERT INTO `ultary_feed` (
  `feed_id`, `user_no`, `content`, `visibility`,
  `like_count`, `comment_count`, `store_count`, `created_at`
) VALUES
(104, 101, '초코 낮잠', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(105, 101, '멍이 소파', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(106, 102, '나비 창가', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 16 HOUR)),
(107, 102, '나비 박스', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 14 HOUR)),
(108, 103, '코코 산책', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(109, 103, '토리 햇살', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
(110, 104, '콩이 첫 산책', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(111, 104, '콩이 간식', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(112, 105, '보리 공원', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(113, 105, '보리 집', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 2 HOUR));

INSERT INTO `ultary_feed_media` (
  `feed_media_id`, `feed_id`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `sort_order`
) VALUES
(106, 104, 142, 'IMAGE', NULL, NULL, 0),
(107, 105, 143, 'IMAGE', NULL, NULL, 0),
(108, 106, 144, 'IMAGE', NULL, NULL, 0),
(109, 107, 145, 'IMAGE', NULL, NULL, 0),
(110, 108, 146, 'IMAGE', NULL, NULL, 0),
(111, 109, 147, 'IMAGE', NULL, NULL, 0),
(112, 110, 148, 'IMAGE', NULL, NULL, 0),
(113, 111, 149, 'IMAGE', NULL, NULL, 0),
(114, 112, 150, 'IMAGE', NULL, NULL, 0),
(115, 113, 151, 'IMAGE', NULL, NULL, 0);

INSERT INTO `ultary_feed_pet` (
  `feed_pet_id`, `feed_id`, `pet_id`, `added_by_user_no`, `role`, `is_main`
) VALUES
(105, 104, 101, 101, 'COLLABORATOR', 1),
(106, 105, 102, 101, 'COLLABORATOR', 1),
(107, 106, 103, 102, 'COLLABORATOR', 1),
(108, 107, 103, 102, 'COLLABORATOR', 1),
(109, 108, 104, 103, 'COLLABORATOR', 1),
(110, 109, 105, 103, 'COLLABORATOR', 1),
(111, 110, 106, 104, 'COLLABORATOR', 1),
(112, 111, 106, 104, 'COLLABORATOR', 1),
(113, 112, 107, 105, 'COLLABORATOR', 1),
(114, 113, 107, 105, 'COLLABORATOR', 1);

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

-- ---------- 구경 계정 좋아요 (기존 피드·댓글·답글만, 작성자 101의 likedByMe는 비움) ----------
-- 피드 101: 14명 / 102: 10명 / 103: 16명 (기존 101·102 좋아요와 중복 없음)
INSERT INTO `ultary_feed_like` (`feed_like_id`, `feed_id`, `user_no`) VALUES
(201, 101, 201), (202, 101, 202), (203, 101, 204), (204, 101, 205),
(205, 101, 207), (206, 101, 208), (207, 101, 210), (208, 101, 211),
(209, 101, 213), (210, 101, 214), (211, 101, 216), (212, 101, 217),
(213, 101, 219), (214, 101, 220),
(215, 102, 202), (216, 102, 204), (217, 102, 206), (218, 102, 208),
(219, 102, 210), (220, 102, 212), (221, 102, 214), (222, 102, 216),
(223, 102, 218), (224, 102, 220),
(225, 103, 201), (226, 103, 202), (227, 103, 203), (228, 103, 204),
(229, 103, 206), (230, 103, 207), (231, 103, 208), (232, 103, 209),
(233, 103, 211), (234, 103, 212), (235, 103, 213), (236, 103, 214),
(237, 103, 216), (238, 103, 217), (239, 103, 218), (240, 103, 219);

INSERT INTO `ultary_feed_comment_like` (`feed_comment_like_id`, `feed_comment_id`, `user_no`) VALUES
(201, 101, 201), (202, 101, 203), (203, 101, 204), (204, 101, 206),
(205, 101, 208), (206, 101, 209), (207, 101, 211), (208, 101, 213),
(209, 101, 215), (210, 101, 218), (211, 101, 220);

INSERT INTO `ultary_feed_reply_like` (`feed_reply_like_id`, `feed_reply_id`, `user_no`) VALUES
(201, 101, 202), (202, 101, 207), (203, 101, 212),
(204, 101, 214), (205, 101, 216), (206, 101, 219);

-- ---------- 테스트 댓글·답글 (본문 맨 앞 @멘션 + mentions 행) ----------
-- 피드 101 스레드 합 10 (기존 1댓글+1답글 포함) → 목록에 replies 포함
INSERT INTO `ultary_feed_comment` (
  `feed_comment_id`, `feed_id`, `user_no`, `content`, `created_at`
) VALUES
(201, 101, 103, '주말에도 한강 가고 싶다', DATE_ADD(NOW(), INTERVAL 1 MINUTE)),
(202, 101, 105, '@산책러 다음에 같이 가요', DATE_ADD(NOW(), INTERVAL 2 MINUTE)),
(203, 101, 104, '사진 구도 진짜 예쁘다 어디서 찍었어요?', DATE_ADD(NOW(), INTERVAL 4 MINUTE)),
(204, 101, 201, '@울타리 완전 공감해요 저도 그렇게 생각했어요', DATE_ADD(NOW(), INTERVAL 6 MINUTE)),
(205, 101, 202, '이 댓글은 길어서 스크롤 테스트용이에요. 내용이 여러 줄로 내려가면 더보기도 같이 볼 수 있어요.', DATE_ADD(NOW(), INTERVAL 8 MINUTE)),
(206, 102, 101, '@나리집사 나비 표정이 좋다', DATE_ADD(NOW(), INTERVAL 1 MINUTE)),
(207, 102, 103, '냥스타그램 인정', DATE_ADD(NOW(), INTERVAL 2 MINUTE)),
(208, 102, 105, '@choco_01 도 잘 나왔다', DATE_ADD(NOW(), INTERVAL 4 MINUTE)),
(209, 103, 102, '@산책러 공원 어디예요', DATE_ADD(NOW(), INTERVAL 1 MINUTE)),
(210, 103, 101, '코코 표정이 좋다', DATE_ADD(NOW(), INTERVAL 2 MINUTE)),
(211, 103, 104, '주말 산책 부러워요', DATE_ADD(NOW(), INTERVAL 4 MINUTE));

INSERT INTO `ultary_feed_reply` (
  `feed_reply_id`, `feed_comment_id`, `user_no`, `content`, `created_at`
) VALUES
(201, 202, 103, '@팔로워 좋아요 그때 봐요', DATE_ADD(NOW(), INTERVAL 3 MINUTE)),
(202, 203, 101, '여의나루 쪽이요', DATE_ADD(NOW(), INTERVAL 5 MINUTE)),
(203, 204, 102, '@구경꾼 저도 그 생각이에요', DATE_ADD(NOW(), INTERVAL 7 MINUTE)),
(204, 206, 102, '고마워요 @울타리', DATE_ADD(NOW(), INTERVAL 3 MINUTE)),
(205, 209, 103, '성남 중앙공원이에요 @나리집사', DATE_ADD(NOW(), INTERVAL 3 MINUTE));

-- 알림 이동 테스트. 104·105 답글, 106·110~113 댓글
INSERT INTO `ultary_feed_comment` (
  `feed_comment_id`, `feed_id`, `user_no`, `content`, `created_at`
) VALUES
(216, 110, 102, '콩이 첫 산책 귀엽다', DATE_ADD(NOW(), INTERVAL 1 MINUTE)),
(217, 112, 101, '보리 공원 좋다', DATE_ADD(NOW(), INTERVAL 1 MINUTE)),
(218, 106, 101, '나비 창가 예쁘다', DATE_ADD(NOW(), INTERVAL 1 MINUTE)),
(219, 111, 105, '콩이 간식 뭐 먹여요?', DATE_ADD(NOW(), INTERVAL 1 MINUTE)),
(220, 113, 103, '보리 집 포근하다', DATE_ADD(NOW(), INTERVAL 1 MINUTE));

INSERT INTO `ultary_feed_reply` (
  `feed_reply_id`, `feed_comment_id`, `user_no`, `content`, `created_at`
) VALUES
(208, 211, 104, '콩이도 다음엔 같이 가요', DATE_ADD(NOW(), INTERVAL 6 MINUTE)),
(209, 207, 105, '보리도 그 사료 먹어요', DATE_ADD(NOW(), INTERVAL 5 MINUTE)),
(210, 216, 103, '다음에 같이 걸어요', DATE_ADD(NOW(), INTERVAL 2 MINUTE)),
(211, 217, 102, '보리 산책 코스 좋아요', DATE_ADD(NOW(), INTERVAL 2 MINUTE));

INSERT INTO `ultary_feed_comment_mention` (
  `feed_comment_mention_id`, `feed_comment_id`, `feed_reply_id`, `mentioned_user_no`, `mentioned_pet_id`
) VALUES
(201, 202, NULL, 103, NULL),
(202, NULL, 201, 105, NULL),
(203, 204, NULL, 101, NULL),
(204, NULL, 203, 201, NULL),
(205, 206, NULL, 102, NULL),
(206, NULL, 204, 101, NULL),
(207, 208, NULL, NULL, 101),
(208, 209, NULL, 103, NULL),
(209, NULL, 205, 102, NULL);

INSERT INTO `ultary_feed_comment_like` (`feed_comment_like_id`, `feed_comment_id`, `user_no`) VALUES
(301, 201, 201), (302, 201, 202), (303, 201, 203), (304, 201, 204),
(305, 201, 205), (306, 201, 206), (307, 201, 207), (308, 201, 208),
(309, 202, 209), (310, 202, 210), (311, 202, 211), (312, 202, 212),
(313, 202, 213), (314, 202, 214), (315, 202, 101),
(316, 203, 201), (317, 203, 203), (318, 203, 205), (319, 203, 207),
(320, 203, 209), (321, 203, 101),
(322, 204, 202), (323, 204, 204), (324, 204, 206),
(325, 206, 101), (326, 206, 201), (327, 206, 202), (328, 206, 203),
(329, 206, 204), (330, 206, 205), (331, 206, 206), (332, 206, 207),
(333, 206, 208), (334, 206, 209), (335, 206, 210),
(336, 207, 211), (337, 207, 212), (338, 207, 213), (339, 207, 214),
(340, 207, 215), (341, 207, 216),
(342, 208, 201), (343, 208, 205), (344, 208, 210),
(345, 209, 201), (346, 209, 202), (347, 209, 203), (348, 209, 204),
(349, 209, 205), (350, 209, 206), (351, 209, 207), (352, 209, 104),
(353, 210, 208), (354, 210, 209), (355, 210, 210), (356, 210, 211),
(357, 210, 212),
(358, 211, 215);

INSERT INTO `ultary_feed_reply_like` (`feed_reply_like_id`, `feed_reply_id`, `user_no`) VALUES
(301, 201, 215), (302, 201, 216), (303, 201, 217), (304, 201, 218),
(305, 201, 219), (306, 201, 220),
(307, 202, 101), (308, 202, 201), (309, 202, 202),
(310, 203, 203), (311, 203, 208), (312, 203, 212), (313, 203, 216),
(314, 204, 103), (315, 204, 217), (316, 204, 218), (317, 204, 219),
(318, 204, 220),
(319, 205, 101), (320, 205, 213), (321, 205, 214);

UPDATE `ultary_feed` f
INNER JOIN (
  SELECT `feed_id`, COUNT(*) AS cnt
  FROM `ultary_feed_like`
  WHERE `is_deleted` = 0 AND `feed_id` IN (101, 102, 103)
  GROUP BY `feed_id`
) x ON x.feed_id = f.feed_id
SET f.like_count = x.cnt
WHERE f.feed_id IN (101, 102, 103);

UPDATE `ultary_feed_comment` c
INNER JOIN (
  SELECT `feed_comment_id`, COUNT(*) AS cnt
  FROM `ultary_feed_comment_like`
  WHERE `is_deleted` = 0
    AND `feed_comment_id` IN (101, 201, 202, 203, 204, 206, 207, 208, 209, 210, 211)
  GROUP BY `feed_comment_id`
) x ON x.feed_comment_id = c.feed_comment_id
SET c.like_count = x.cnt
WHERE c.feed_comment_id IN (101, 201, 202, 203, 204, 206, 207, 208, 209, 210, 211);

UPDATE `ultary_feed_reply` r
INNER JOIN (
  SELECT `feed_reply_id`, COUNT(*) AS cnt
  FROM `ultary_feed_reply_like`
  WHERE `is_deleted` = 0
    AND `feed_reply_id` IN (101, 201, 202, 203, 204, 205)
  GROUP BY `feed_reply_id`
) x ON x.feed_reply_id = r.feed_reply_id
SET r.like_count = x.cnt
WHERE r.feed_reply_id IN (101, 201, 202, 203, 204, 205);

UPDATE `ultary_feed` f
INNER JOIN (
  SELECT `feed_id`, COUNT(*) AS cnt
  FROM `ultary_feed_comment`
  WHERE `is_deleted` = 0 AND `feed_id` IN (101, 102, 103)
  GROUP BY `feed_id`
) x ON x.feed_id = f.feed_id
SET f.comment_count = x.cnt
WHERE f.feed_id IN (101, 102, 103);

-- ---------- 스토리 (101 본인 1 + 주민 102·103 각 4 + 이웃 105 1) ----------
-- created_at 간격: ASC 재생·viewedByMe 테스트용 (오래된 것부터)
INSERT INTO `ultary_story` (
  `story_id`, `user_no`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `caption`,
  `created_at`, `expires_at`
) VALUES
(101, 101, 130, 'IMAGE', NULL, NULL, '오늘 산책 스토리',
 DATE_SUB(NOW(), INTERVAL 50 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 50 MINUTE), INTERVAL 24 HOUR)),
-- 102 나리집사 (4): story2 + story5~7
(102, 102, 131, 'IMAGE', NULL, NULL, '나리집사 스토리 1',
 DATE_SUB(NOW(), INTERVAL 40 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 40 MINUTE), INTERVAL 24 HOUR)),
(105, 102, 134, 'IMAGE', NULL, NULL, '나리집사 스토리 2',
 DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 30 MINUTE), INTERVAL 24 HOUR)),
(106, 102, 135, 'IMAGE', NULL, NULL, '나리집사 스토리 3',
 DATE_SUB(NOW(), INTERVAL 20 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 20 MINUTE), INTERVAL 24 HOUR)),
(107, 102, 136, 'IMAGE', NULL, NULL, '나리집사 스토리 4',
 DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 10 MINUTE), INTERVAL 24 HOUR)),
-- 103 산책러 (4): story3 + story8~10
(103, 103, 132, 'IMAGE', NULL, NULL, '산책러 스토리 1',
 DATE_SUB(NOW(), INTERVAL 35 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 35 MINUTE), INTERVAL 24 HOUR)),
(108, 103, 137, 'IMAGE', NULL, NULL, '산책러 스토리 2',
 DATE_SUB(NOW(), INTERVAL 25 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 25 MINUTE), INTERVAL 24 HOUR)),
(109, 103, 138, 'IMAGE', NULL, NULL, '산책러 스토리 3',
 DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 15 MINUTE), INTERVAL 24 HOUR)),
(110, 103, 139, 'IMAGE', NULL, NULL, '산책러 스토리 4',
 DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 5 MINUTE), INTERVAL 24 HOUR)),
(104, 105, 133, 'IMAGE', NULL, NULL, '팔로워 스토리',
 DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 45 MINUTE), INTERVAL 24 HOUR));

ALTER TABLE `ultary_user` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_file` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_pet` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_tag` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_tag_image` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_media` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_media_mention` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_pet` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_tag` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_like` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_feed_comment_like` AUTO_INCREMENT = 400;
ALTER TABLE `ultary_feed_reply_like` AUTO_INCREMENT = 400;
ALTER TABLE `ultary_feed_store` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_comment` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_feed_reply` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_feed_comment_mention` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_story` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_neighbor` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_user_social` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_user_block` AUTO_INCREMENT = 200;

-- ---------- 최근 검색 (101이 다른 유저 울타리에 1명당 1건) ----------
INSERT INTO `ultary_user_search_history` (
  `user_search_history_id`, `user_no`, `target_user_no`, `searched_at`
) VALUES
(101, 101, 102, DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
(102, 101, 103, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(103, 101, 104, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(104, 101, 105, DATE_SUB(NOW(), INTERVAL 4 MINUTE));

ALTER TABLE `ultary_user_search_history` AUTO_INCREMENT = 200;

-- ---------- 알림 75건 (101~105 각 15, 구경 계정 제외) ----------
-- 최신 12건 안 읽음, 오래된 3건 읽음. snippet 은 이동 대상 글의 일부.
INSERT INTO `ultary_notification` (
  `notification_id`, `receiver_user_no`, `actor_user_no`, `type`,
  `feed_id`, `feed_comment_id`, `feed_reply_id`, `story_id`, `neighbor_id`,
  `content`, `actor_count`, `has_comment`, `has_reply`, `group_key`,
  `is_read`, `created_at`, `updated_at`
) VALUES
-- 101 울타리
(1001, 101, 104, 'NEIGHBOR_REQUEST', NULL, NULL, NULL, NULL, 104, NULL, 1, 0, 0, 'NEIGHBOR_REQUEST:104', 0, DATE_SUB(NOW(), INTERVAL 1 MINUTE), DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
(1002, 101, 102, 'FEED_LIKE', 101, NULL, NULL, NULL, NULL, '초코랑 한강 산책 #산책 #royalcanin', 5, 0, 0, 'FEED_LIKE:101', 0, DATE_SUB(NOW(), INTERVAL 2 MINUTE), DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(1003, 101, 103, 'FEED_LIKE', 104, NULL, NULL, NULL, NULL, '초코 낮잠', 1, 0, 0, 'FEED_LIKE:104', 0, DATE_SUB(NOW(), INTERVAL 3 MINUTE), DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(1004, 101, 102, 'COMMENT_LIKE', 102, 206, NULL, NULL, NULL, '@나리집사 나비 표정이 좋다', 3, 0, 0, 'COMMENT_LIKE:206', 0, DATE_SUB(NOW(), INTERVAL 4 MINUTE), DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
(1005, 101, 105, 'COMMENT_LIKE', 103, 210, NULL, NULL, NULL, '코코 표정이 좋다', 1, 0, 0, 'COMMENT_LIKE:210', 0, DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(1006, 101, 102, 'REPLY_LIKE', 101, 101, 101, NULL, NULL, '고마워! @나리집사', 4, 0, 0, 'REPLY_LIKE:101', 0, DATE_SUB(NOW(), INTERVAL 6 MINUTE), DATE_SUB(NOW(), INTERVAL 6 MINUTE)),
(1007, 101, 103, 'REPLY_LIKE', 101, 203, 202, NULL, NULL, '여의나루 쪽이요', 1, 0, 0, 'REPLY_LIKE:202', 0, DATE_SUB(NOW(), INTERVAL 7 MINUTE), DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
(1008, 101, 103, 'FEED_COMMENT', 101, 202, 201, NULL, NULL, '@팔로워 좋아요 그때 봐요', 4, 1, 1, 'FEED_COMMENT:101', 0, DATE_SUB(NOW(), INTERVAL 8 MINUTE), DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
(1009, 101, 102, 'COMMENT_MENTION', 101, 101, NULL, NULL, NULL, '초코 너무 귀엽다! @울타리 @choco_01', 1, 0, 0, 'COMMENT_MENTION:101', 0, DATE_SUB(NOW(), INTERVAL 9 MINUTE), DATE_SUB(NOW(), INTERVAL 9 MINUTE)),
(1010, 101, 102, 'REPLY_MENTION', 102, 206, 204, NULL, NULL, '고마워요 @울타리', 1, 0, 0, 'REPLY_MENTION:204', 0, DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(1011, 101, 102, 'FEED_TAG', 102, NULL, NULL, NULL, NULL, '초코도 등장! #냥스타그램', 1, 0, 0, 'FEED_TAG:102', 0, DATE_SUB(NOW(), INTERVAL 11 MINUTE), DATE_SUB(NOW(), INTERVAL 11 MINUTE)),
(1012, 101, 105, 'FEED_LIKE', 105, NULL, NULL, NULL, NULL, '멍이 소파', 2, 0, 0, 'FEED_LIKE:105', 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE), DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(1013, 101, 102, 'STORY_TAG', NULL, NULL, NULL, 101, NULL, '오늘 산책 스토리', 1, 0, 0, 'STORY_TAG:101', 1, DATE_SUB(NOW(), INTERVAL 13 MINUTE), DATE_SUB(NOW(), INTERVAL 13 MINUTE)),
(1014, 101, 103, 'STORY_LIKE', NULL, NULL, NULL, 101, NULL, '오늘 산책 스토리', 4, 0, 0, 'STORY_LIKE:101', 1, DATE_SUB(NOW(), INTERVAL 14 MINUTE), DATE_SUB(NOW(), INTERVAL 14 MINUTE)),
(1015, 101, 103, 'FEED_TAG', 103, NULL, NULL, NULL, NULL, '주말 공원 산책 #산책', 1, 0, 0, 'FEED_TAG:103', 1, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
-- 102 나리집사
(1016, 102, 105, 'NEIGHBOR_REQUEST', NULL, NULL, NULL, NULL, 105, NULL, 1, 0, 0, 'NEIGHBOR_REQUEST:105', 0, DATE_SUB(NOW(), INTERVAL 1 MINUTE), DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
(1017, 102, 101, 'FEED_LIKE', 102, NULL, NULL, NULL, NULL, '초코도 등장! #냥스타그램', 4, 0, 0, 'FEED_LIKE:102', 0, DATE_SUB(NOW(), INTERVAL 2 MINUTE), DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(1018, 102, 103, 'FEED_LIKE', 106, NULL, NULL, NULL, NULL, '나비 창가', 1, 0, 0, 'FEED_LIKE:106', 0, DATE_SUB(NOW(), INTERVAL 3 MINUTE), DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(1019, 102, 101, 'COMMENT_LIKE', 101, 101, NULL, NULL, NULL, '초코 너무 귀엽다! @울타리 @choco_01', 2, 0, 0, 'COMMENT_LIKE:101', 0, DATE_SUB(NOW(), INTERVAL 4 MINUTE), DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
(1020, 102, 104, 'COMMENT_LIKE', 103, 209, NULL, NULL, NULL, '@산책러 공원 어디예요', 1, 0, 0, 'COMMENT_LIKE:209', 0, DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(1021, 102, 101, 'REPLY_LIKE', 102, 206, 204, NULL, NULL, '고마워요 @울타리', 3, 0, 0, 'REPLY_LIKE:204', 0, DATE_SUB(NOW(), INTERVAL 6 MINUTE), DATE_SUB(NOW(), INTERVAL 6 MINUTE)),
(1022, 102, 103, 'REPLY_LIKE', 101, 204, 203, NULL, NULL, '@구경꾼 저도 그 생각이에요', 1, 0, 0, 'REPLY_LIKE:203', 0, DATE_SUB(NOW(), INTERVAL 7 MINUTE), DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
(1023, 102, 101, 'FEED_COMMENT', 102, 206, 204, NULL, NULL, '고마워요 @울타리', 2, 1, 1, 'FEED_COMMENT:102', 0, DATE_SUB(NOW(), INTERVAL 8 MINUTE), DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
(1024, 102, 101, 'FEED_COMMENT', 106, 218, NULL, NULL, NULL, '나비 창가 예쁘다', 1, 1, 0, 'FEED_COMMENT:106', 0, DATE_SUB(NOW(), INTERVAL 9 MINUTE), DATE_SUB(NOW(), INTERVAL 9 MINUTE)),
(1025, 102, 101, 'COMMENT_MENTION', 102, 206, NULL, NULL, NULL, '@나리집사 나비 표정이 좋다', 1, 0, 0, 'COMMENT_MENTION:206', 0, DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(1026, 102, 103, 'REPLY_MENTION', 103, 209, 205, NULL, NULL, '성남 중앙공원이에요 @나리집사', 1, 0, 0, 'REPLY_MENTION:205', 0, DATE_SUB(NOW(), INTERVAL 11 MINUTE), DATE_SUB(NOW(), INTERVAL 11 MINUTE)),
(1027, 102, 103, 'FEED_TAG', 103, NULL, NULL, NULL, NULL, '주말 공원 산책 #산책', 1, 0, 0, 'FEED_TAG:103', 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE), DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(1028, 102, 104, 'FEED_LIKE', 107, NULL, NULL, NULL, NULL, '나비 박스', 1, 0, 0, 'FEED_LIKE:107', 1, DATE_SUB(NOW(), INTERVAL 13 MINUTE), DATE_SUB(NOW(), INTERVAL 13 MINUTE)),
(1029, 102, 101, 'STORY_TAG', NULL, NULL, NULL, 102, NULL, '나리집사 스토리 1', 1, 0, 0, 'STORY_TAG:102', 1, DATE_SUB(NOW(), INTERVAL 14 MINUTE), DATE_SUB(NOW(), INTERVAL 14 MINUTE)),
(1030, 102, 103, 'STORY_LIKE', NULL, NULL, NULL, 105, NULL, '나리집사 스토리 2', 3, 0, 0, 'STORY_LIKE:105', 1, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
-- 103 산책러
(1031, 103, 102, 'NEIGHBOR_REQUEST', NULL, NULL, NULL, NULL, 106, NULL, 1, 0, 0, 'NEIGHBOR_REQUEST:106', 0, DATE_SUB(NOW(), INTERVAL 1 MINUTE), DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
(1032, 103, 102, 'FEED_LIKE', 103, NULL, NULL, NULL, NULL, '주말 공원 산책 #산책', 6, 0, 0, 'FEED_LIKE:103', 0, DATE_SUB(NOW(), INTERVAL 2 MINUTE), DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(1033, 103, 101, 'FEED_LIKE', 108, NULL, NULL, NULL, NULL, '코코 산책', 1, 0, 0, 'FEED_LIKE:108', 0, DATE_SUB(NOW(), INTERVAL 3 MINUTE), DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(1034, 103, 102, 'COMMENT_LIKE', 101, 201, NULL, NULL, NULL, '주말에도 한강 가고 싶다', 2, 0, 0, 'COMMENT_LIKE:201', 0, DATE_SUB(NOW(), INTERVAL 4 MINUTE), DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
(1035, 103, 105, 'COMMENT_LIKE', 102, 207, NULL, NULL, NULL, '냥스타그램 인정', 1, 0, 0, 'COMMENT_LIKE:207', 0, DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(1036, 103, 102, 'REPLY_LIKE', 101, 202, 201, NULL, NULL, '@팔로워 좋아요 그때 봐요', 3, 0, 0, 'REPLY_LIKE:201', 0, DATE_SUB(NOW(), INTERVAL 6 MINUTE), DATE_SUB(NOW(), INTERVAL 6 MINUTE)),
(1037, 103, 101, 'REPLY_LIKE', 103, 209, 205, NULL, NULL, '성남 중앙공원이에요 @나리집사', 1, 0, 0, 'REPLY_LIKE:205', 0, DATE_SUB(NOW(), INTERVAL 7 MINUTE), DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
(1038, 103, 102, 'FEED_COMMENT', 103, 209, 205, NULL, NULL, '성남 중앙공원이에요 @나리집사', 3, 1, 1, 'FEED_COMMENT:103', 0, DATE_SUB(NOW(), INTERVAL 8 MINUTE), DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
(1039, 103, 105, 'COMMENT_MENTION', 101, 202, NULL, NULL, NULL, '@산책러 다음에 같이 가요', 1, 0, 0, 'COMMENT_MENTION:202', 0, DATE_SUB(NOW(), INTERVAL 9 MINUTE), DATE_SUB(NOW(), INTERVAL 9 MINUTE)),
(1040, 103, 102, 'REPLY_MENTION', 101, 202, 201, NULL, NULL, '@팔로워 좋아요 그때 봐요', 1, 0, 0, 'REPLY_MENTION:201', 0, DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(1041, 103, 102, 'FEED_TAG', 102, NULL, NULL, NULL, NULL, '초코도 등장! #냥스타그램', 1, 0, 0, 'FEED_TAG:102', 0, DATE_SUB(NOW(), INTERVAL 11 MINUTE), DATE_SUB(NOW(), INTERVAL 11 MINUTE)),
(1042, 103, 104, 'FEED_LIKE', 109, NULL, NULL, NULL, NULL, '토리 햇살', 2, 0, 0, 'FEED_LIKE:109', 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE), DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(1043, 103, 101, 'STORY_TAG', NULL, NULL, NULL, 103, NULL, '산책러 스토리 1', 1, 0, 0, 'STORY_TAG:103', 1, DATE_SUB(NOW(), INTERVAL 13 MINUTE), DATE_SUB(NOW(), INTERVAL 13 MINUTE)),
(1044, 103, 102, 'STORY_LIKE', NULL, NULL, NULL, 108, NULL, '산책러 스토리 2', 4, 0, 0, 'STORY_LIKE:108', 1, DATE_SUB(NOW(), INTERVAL 14 MINUTE), DATE_SUB(NOW(), INTERVAL 14 MINUTE)),
(1045, 103, 101, 'FEED_TAG', 101, NULL, NULL, NULL, NULL, '초코랑 한강 산책 #산책 #royalcanin', 1, 0, 0, 'FEED_TAG:101', 1, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
-- 104 대기중 (스토리 없음)
(1046, 104, 103, 'NEIGHBOR_REQUEST', NULL, NULL, NULL, NULL, 107, NULL, 1, 0, 0, 'NEIGHBOR_REQUEST:107', 0, DATE_SUB(NOW(), INTERVAL 1 MINUTE), DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
(1047, 104, 102, 'FEED_LIKE', 110, NULL, NULL, NULL, NULL, '콩이 첫 산책', 3, 0, 0, 'FEED_LIKE:110', 0, DATE_SUB(NOW(), INTERVAL 2 MINUTE), DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(1048, 104, 101, 'FEED_LIKE', 111, NULL, NULL, NULL, NULL, '콩이 간식', 1, 0, 0, 'FEED_LIKE:111', 0, DATE_SUB(NOW(), INTERVAL 3 MINUTE), DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(1049, 104, 102, 'COMMENT_LIKE', 101, 203, NULL, NULL, NULL, '사진 구도 진짜 예쁘다 어디서 찍었어요?', 2, 0, 0, 'COMMENT_LIKE:203', 0, DATE_SUB(NOW(), INTERVAL 4 MINUTE), DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
(1050, 104, 103, 'COMMENT_LIKE', 103, 211, NULL, NULL, NULL, '주말 산책 부러워요', 1, 0, 0, 'COMMENT_LIKE:211', 0, DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(1051, 104, 102, 'REPLY_LIKE', 103, 211, 208, NULL, NULL, '콩이도 다음엔 같이 가요', 2, 0, 0, 'REPLY_LIKE:208', 0, DATE_SUB(NOW(), INTERVAL 6 MINUTE), DATE_SUB(NOW(), INTERVAL 6 MINUTE)),
(1052, 104, 102, 'FEED_COMMENT', 110, 216, 210, NULL, NULL, '다음에 같이 걸어요', 2, 1, 1, 'FEED_COMMENT:110', 0, DATE_SUB(NOW(), INTERVAL 7 MINUTE), DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
(1053, 104, 105, 'FEED_COMMENT', 111, 219, NULL, NULL, NULL, '콩이 간식 뭐 먹여요?', 1, 1, 0, 'FEED_COMMENT:111', 0, DATE_SUB(NOW(), INTERVAL 8 MINUTE), DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
(1054, 104, 101, 'COMMENT_MENTION', 101, 201, NULL, NULL, NULL, '주말에도 한강 가고 싶다', 1, 0, 0, 'COMMENT_MENTION:201', 0, DATE_SUB(NOW(), INTERVAL 9 MINUTE), DATE_SUB(NOW(), INTERVAL 9 MINUTE)),
(1055, 104, 101, 'REPLY_MENTION', 101, 203, 202, NULL, NULL, '여의나루 쪽이요', 1, 0, 0, 'REPLY_MENTION:202', 0, DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(1056, 104, 102, 'FEED_TAG', 110, NULL, NULL, NULL, NULL, '콩이 첫 산책', 1, 0, 0, 'FEED_TAG:110', 0, DATE_SUB(NOW(), INTERVAL 11 MINUTE), DATE_SUB(NOW(), INTERVAL 11 MINUTE)),
(1057, 104, 105, 'FEED_LIKE', 103, NULL, NULL, NULL, NULL, '주말 공원 산책 #산책', 1, 0, 0, 'FEED_LIKE:103', 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE), DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(1058, 104, 101, 'FEED_TAG', 101, NULL, NULL, NULL, NULL, '초코랑 한강 산책 #산책 #royalcanin', 1, 0, 0, 'FEED_TAG:101', 1, DATE_SUB(NOW(), INTERVAL 13 MINUTE), DATE_SUB(NOW(), INTERVAL 13 MINUTE)),
(1059, 104, 101, 'FEED_LIKE', 104, NULL, NULL, NULL, NULL, '초코 낮잠', 1, 0, 0, 'FEED_LIKE:104', 1, DATE_SUB(NOW(), INTERVAL 14 MINUTE), DATE_SUB(NOW(), INTERVAL 14 MINUTE)),
(1060, 104, 102, 'FEED_LIKE', 105, NULL, NULL, NULL, NULL, '멍이 소파', 1, 0, 0, 'FEED_LIKE:105', 1, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
-- 105 팔로워
(1061, 105, 104, 'NEIGHBOR_REQUEST', NULL, NULL, NULL, NULL, 108, NULL, 1, 0, 0, 'NEIGHBOR_REQUEST:108', 0, DATE_SUB(NOW(), INTERVAL 1 MINUTE), DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
(1062, 105, 101, 'FEED_LIKE', 112, NULL, NULL, NULL, NULL, '보리 공원', 4, 0, 0, 'FEED_LIKE:112', 0, DATE_SUB(NOW(), INTERVAL 2 MINUTE), DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(1063, 105, 102, 'FEED_LIKE', 113, NULL, NULL, NULL, NULL, '보리 집', 1, 0, 0, 'FEED_LIKE:113', 0, DATE_SUB(NOW(), INTERVAL 3 MINUTE), DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(1064, 105, 103, 'COMMENT_LIKE', 101, 202, NULL, NULL, NULL, '@산책러 다음에 같이 가요', 2, 0, 0, 'COMMENT_LIKE:202', 0, DATE_SUB(NOW(), INTERVAL 4 MINUTE), DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
(1065, 105, 101, 'COMMENT_LIKE', 102, 208, NULL, NULL, NULL, '@choco_01 도 잘 나왔다', 1, 0, 0, 'COMMENT_LIKE:208', 0, DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(1066, 105, 103, 'REPLY_LIKE', 102, 207, 209, NULL, NULL, '보리도 그 사료 먹어요', 2, 0, 0, 'REPLY_LIKE:209', 0, DATE_SUB(NOW(), INTERVAL 6 MINUTE), DATE_SUB(NOW(), INTERVAL 6 MINUTE)),
(1067, 105, 101, 'FEED_COMMENT', 112, 217, 211, NULL, NULL, '보리 산책 코스 좋아요', 3, 1, 1, 'FEED_COMMENT:112', 0, DATE_SUB(NOW(), INTERVAL 7 MINUTE), DATE_SUB(NOW(), INTERVAL 7 MINUTE)),
(1068, 105, 103, 'FEED_COMMENT', 113, 220, NULL, NULL, NULL, '보리 집 포근하다', 1, 1, 0, 'FEED_COMMENT:113', 0, DATE_SUB(NOW(), INTERVAL 8 MINUTE), DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
(1069, 105, 103, 'REPLY_MENTION', 101, 202, 201, NULL, NULL, '@팔로워 좋아요 그때 봐요', 1, 0, 0, 'REPLY_MENTION:201', 0, DATE_SUB(NOW(), INTERVAL 9 MINUTE), DATE_SUB(NOW(), INTERVAL 9 MINUTE)),
(1070, 105, 102, 'COMMENT_MENTION', 102, 208, NULL, NULL, NULL, '@choco_01 도 잘 나왔다', 1, 0, 0, 'COMMENT_MENTION:208', 0, DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(1071, 105, 101, 'FEED_TAG', 112, NULL, NULL, NULL, NULL, '보리 공원', 1, 0, 0, 'FEED_TAG:112', 0, DATE_SUB(NOW(), INTERVAL 11 MINUTE), DATE_SUB(NOW(), INTERVAL 11 MINUTE)),
(1072, 105, 104, 'FEED_LIKE', 101, NULL, NULL, NULL, NULL, '초코랑 한강 산책 #산책 #royalcanin', 1, 0, 0, 'FEED_LIKE:101', 0, DATE_SUB(NOW(), INTERVAL 12 MINUTE), DATE_SUB(NOW(), INTERVAL 12 MINUTE)),
(1073, 105, 102, 'STORY_TAG', NULL, NULL, NULL, 104, NULL, '팔로워 스토리', 1, 0, 0, 'STORY_TAG:104', 1, DATE_SUB(NOW(), INTERVAL 13 MINUTE), DATE_SUB(NOW(), INTERVAL 13 MINUTE)),
(1074, 105, 101, 'STORY_LIKE', NULL, NULL, NULL, 104, NULL, '팔로워 스토리', 3, 0, 0, 'STORY_LIKE:104', 1, DATE_SUB(NOW(), INTERVAL 14 MINUTE), DATE_SUB(NOW(), INTERVAL 14 MINUTE)),
(1075, 105, 103, 'FEED_TAG', 103, NULL, NULL, NULL, NULL, '주말 공원 산책 #산책', 1, 0, 0, 'FEED_TAG:103', 1, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE));

ALTER TABLE `ultary_notification` AUTO_INCREMENT = 1100;

-- ---------- DM (101의 주민 102·103, 이웃 105) ----------
-- 101↔102: 101은 104까지 읽음 → 안 읽음 3. 112는 스토리와 메시지를 같이 보냄.
INSERT INTO `ultary_dm_room` (
  `dm_room_id`, `pair_key`, `user_low`, `user_high`,
  `low_last_read_message_id`, `high_last_read_message_id`, `created_at`
) VALUES
(101, '101:102', 101, 102, 104, 112, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(102, '101:103', 101, 103, 108, 108, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(103, '101:105', 101, 105, 110, 110, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO `ultary_dm_message` (
  `dm_message_id`, `dm_room_id`, `sender_user_no`, `body`,
  `share_type`, `feed_id`, `feed_media_id`, `story_id`, `created_at`
) VALUES
(101, 101, 102, '안녕하세요! 울타리에서 봤어요.', 'NONE', NULL, NULL, NULL, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:20:00')),
(102, 101, 101, '안녕하세요 :) 반갑습니다.', 'NONE', NULL, NULL, NULL, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 18:22:00')),
(103, 101, 102, '이 사진 봐', 'FEED', 102, 104, NULL, DATE_SUB(NOW(), INTERVAL 40 MINUTE)),
(104, 101, 102, NULL, 'STORY', NULL, NULL, 102, DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(105, 101, 102, '공원에서 만나요', 'NONE', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
(106, 101, 102, '다음에 산책 같이 가요!', 'NONE', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(107, 102, 101, '코코 사진 봤어요', 'NONE', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(108, 102, 103, '코코 너무 귀여워요', 'NONE', NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(109, 103, 101, '구도는 낮게 찍으면 좋아요', 'NONE', NULL, NULL, NULL, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 15:10:00')),
(110, 103, 105, '사진 구도 팁 알려주셔서 감사해요', 'NONE', NULL, NULL, NULL, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 16:40:00')),
(112, 101, 102, '방금 올린 스토리야. 공원에서 찍었어', 'STORY', NULL, NULL, 105, DATE_SUB(NOW(), INTERVAL 1 MINUTE));

ALTER TABLE `ultary_dm_room` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_dm_message` AUTO_INCREMENT = 200;
