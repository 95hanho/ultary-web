-- ============================================================
-- ULTARY 로컬/개발용 샘플 데이터 (schema_version 9)
-- 실행: 001_init_schema.sql(v8) 이후. 운영에서는 실행하지 않음.
-- 재실행: CLEANUP 후 INSERT (그대로 다시 실행 가능).
--
-- CDN (Cafe24): https://ehfqntuqntu.cdn1.cafe24.com/ultary/{filename}
--   profile.jpg ~ profile9.png 은 모두 펫 프로필. profile.jpg=pet 108, profile2=pet 109, profile6~9=초코·멍이·나비·코코
--   post.jpg, post2~4, post6 (기존 피드) + post5, post7~post30 (추가 피드, 구경 계정 제외)
--   story.png ~ story16.png (스토리 16)
--   goods.png, goods2.png, goods3~goods12 (태그/상품 12. goods3~12는 상품 그리드 왼쪽→오른쪽)
--   상품 사진을 게시글에 다시 쓸 때는 file 행을 새로 만든다. file_id 하나는 태그·게시글·스토리 중 한 곳에만 연결
--
-- 시드: user 101~105, 광고 전용 106~108 / pet 101~109 / file 110~224 (CDN만. 로컬 업로드 파일은 재실행 시 삭제)
--       구경 계정 user 201~220 (피드·펫 없음, 비밀번호 Test1234!)
--       feed 101~158 (129~158은 상품 광고·후기. 같은 CDN을 file 행만 나눠 씀) / story 101~116 / tag 101~117
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
   OR `sender_user_no` IN (101, 102, 103, 104, 105, 106, 107, 108);

DELETE FROM `ultary_dm_room`
WHERE `dm_room_id` BETWEEN 101 AND 103
   OR `user_low` IN (101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_high` IN (101, 102, 103, 104, 105, 106, 107, 108);

DELETE FROM `ultary_notification`
WHERE `receiver_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `actor_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `notification_id` BETWEEN 1001 AND 1099;

DELETE FROM `ultary_story_view`
WHERE `viewer_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `story_id` BETWEEN 101 AND 116
   OR `story_id` IN (1);

DELETE FROM `ultary_story`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `story_id` BETWEEN 101 AND 116
   OR `story_id` IN (1)
   OR `file_id` BETWEEN 100 AND 299
   OR `file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%')
   OR `thumbnail_file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%');

DELETE FROM `ultary_feed_comment_like`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_no` BETWEEN 201 AND 220
   OR `feed_comment_id` IN (1, 101)
   OR `feed_comment_id` BETWEEN 201 AND 220;

DELETE FROM `ultary_feed_reply_like`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_no` BETWEEN 201 AND 220
   OR `feed_reply_id` IN (1, 101)
   OR `feed_reply_id` BETWEEN 201 AND 220;

DELETE FROM `ultary_feed_comment_mention`
WHERE `feed_comment_id` IN (1, 101)
   OR `feed_comment_id` BETWEEN 201 AND 220
   OR `feed_reply_id` IN (1, 101)
   OR `feed_reply_id` BETWEEN 201 AND 220
   OR `mentioned_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `mentioned_user_no` BETWEEN 201 AND 220
   OR `mentioned_pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `feed_comment_mention_id` IN (1, 2, 3, 101, 102, 103)
   OR `feed_comment_mention_id` BETWEEN 201 AND 220;

DELETE FROM `ultary_feed_reply`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_no` BETWEEN 201 AND 220
   OR `feed_reply_id` IN (1, 101)
   OR `feed_reply_id` BETWEEN 201 AND 220
   OR `feed_comment_id` IN (1, 101)
   OR `feed_comment_id` BETWEEN 201 AND 220;

DELETE FROM `ultary_feed_comment`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `feed_comment_id` IN (1, 101)
   OR `feed_id` IN (1, 2, 101, 102, 103);

DELETE FROM `ultary_feed_save`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `feed_id` IN (1, 2, 101, 102, 103);

DELETE FROM `ultary_feed_pin`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `feed_id` IN (1, 2, 101, 102, 103);

DELETE FROM `ultary_feed_like`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_no` BETWEEN 201 AND 220
   OR `feed_id` IN (1, 2, 101, 102, 103);

DELETE FROM `ultary_feed_tag`
WHERE `feed_id` IN (1, 2, 101, 102, 103)
   OR `feed_id` BETWEEN 104 AND 158
   OR `tag_id` IN (1, 2, 3, 101, 102, 103)
   OR `tag_id` BETWEEN 104 AND 130;

DELETE FROM `ultary_tag_image`
WHERE `tag_id` IN (1, 2, 3, 101, 102, 103)
   OR `file_id` BETWEEN 100 AND 299
   OR `file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%');

DELETE FROM `ultary_feed_media_mention`
WHERE `feed_media_id` IN (1, 2, 3, 101, 102, 103, 104, 105)
   OR `pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `added_by_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108);

DELETE FROM `ultary_feed_media`
WHERE `feed_id` IN (1, 2, 101, 102, 103)
   OR `file_id` BETWEEN 100 AND 299
   OR `thumbnail_file_id` BETWEEN 100 AND 299
   OR `file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%')
   OR `thumbnail_file_id` IN (SELECT `file_id` FROM `ultary_file` WHERE `file_path` NOT LIKE 'https://ehfqntuqntu.cdn1.cafe24.com/%');

DELETE FROM `ultary_feed_pet`
WHERE `feed_id` IN (1, 2, 101, 102, 103)
   OR `pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `added_by_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108);

DELETE FROM `ultary_feed`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `feed_id` IN (1, 2, 101, 102, 103);

DELETE FROM `ultary_user_block`
WHERE `blocker_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `blocked_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108);

DELETE FROM `ultary_neighbor`
WHERE `neighbor_id` IN (1, 101, 102, 103, 104, 105)
   OR `requester_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `receiver_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108);

DELETE FROM `ultary_tag`
WHERE `tag_id` IN (1, 2, 3, 101, 102, 103)
   OR `created_by_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `handle` IN ('royal_canin_01');

DELETE FROM `ultary_user_privacy`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108);

DELETE FROM `ultary_pet`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `pet_id` IN (1, 2, 101, 102, 103, 104, 105, 106, 107)
   OR `mention_id` IN ('choco_01', 'nabi_01', 'mung_01', 'coco_01', 'tori_01', 'kong_01', 'bori_01', 'dal_01', 'momo_01');

DELETE FROM `ultary_token`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_no` BETWEEN 201 AND 220;

DELETE FROM `ultary_user_search_history`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_no` BETWEEN 201 AND 220
   OR `target_user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `target_user_no` BETWEEN 201 AND 220;

DELETE FROM `ultary_user_social`
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_no` BETWEEN 201 AND 220
   OR `provider_user_id` IN (
     'google-seed-user-001',
     'kakao-seed-user-002',
     'google-myultary-test-001',
     'kakao-seed-neighbor-102',
     'google-seed-user-103',
     'google-seed-user-104',
     'kakao-seed-user-105',
     'google-seed-ad-106',
     'google-seed-ad-107',
     'google-seed-ad-108'
   )
   OR `provider_user_id` LIKE 'google-seed-viewer-%';

DELETE FROM `ultary_file`
WHERE `file_id` BETWEEN 100 AND 299
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
WHERE `user_no` IN (1, 2, 101, 102, 103, 104, 105, 106, 107, 108)
   OR `user_no` BETWEEN 201 AND 220
   OR `email` IN (
     'seed.dog@example.com',
     'seed.cat@example.com',
     'myultary.test@example.com',
     'seed.neighbor@example.com',
     'seed.u103@example.com',
     'seed.u104@example.com',
     'seed.u105@example.com',
     'seed.ad106@example.com',
     'seed.ad107@example.com',
     'seed.ad108@example.com'
   )
   OR `email` LIKE 'viewer2%@example.com'
   OR `nickname` IN (
     '울타리견주', '울타리냥이', '울타리', '나리집사',
     '산책러', '대기중', '팔로워',
     '구경꾼', '산책손님', '냥덕후', '강아지팬', '한강러',
     '공원지기', '간식러', '냥집사', '멍멍이', '냥냥이',
     '구름이', '바람돌', '달빛', '별빛', '풀잎',
     '모래알', '하늘색', '노을빛', '아침이슬', '저녁노을',
     '펫샵', '용품몰', '산책샵'
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

-- ---------- 광고 전용 계정 3명 (상품 글만. 비밀번호: {noop}Test1234!) ----------
INSERT INTO `ultary_user` (
  `user_no`, `password`, `name`, `nickname`, `nickname_changed_at`,
  `is_default_nickname`, `email`, `phone`, `bio`,
  `region_sido`, `region_sigungu`, `withdrawal_status`
) VALUES
(106, '{noop}Test1234!', '한빛', '펫샵',   NOW(), 0, 'seed.ad106@example.com', '01010600106', '상품 광고만 올리는 계정', '서울특별시', '마포구', 'ACTIVE'),
(107, '{noop}Test1234!', '도윤', '용품몰', NOW(), 0, 'seed.ad107@example.com', '01010700107', '상품 광고만 올리는 계정', '경기도', '성남시', 'ACTIVE'),
(108, '{noop}Test1234!', '서준', '산책샵', NOW(), 0, 'seed.ad108@example.com', '01010800108', '상품 광고만 올리는 계정', '부산광역시', '해운대구', 'ACTIVE');

INSERT INTO `ultary_user_social` (
  `user_no`, `provider`, `provider_user_id`, `provider_email`
) VALUES
(106, 'GOOGLE', 'google-seed-ad-106', 'seed.ad106@example.com'),
(107, 'GOOGLE', 'google-seed-ad-107', 'seed.ad107@example.com'),
(108, 'GOOGLE', 'google-seed-ad-108', 'seed.ad108@example.com');

-- ---------- CDN 파일 (profile 9, post 15+15, story 16, goods 2) ----------
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
(141, 'goods2.png', 'goods2.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods2.png', 'OWNED', 102, NOW(), 0),
-- 펫 프로필 추가 profile6~9 (초코·멍이·나비·코코)
(160, 'profile6.png', 'profile6.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile6.png', 'OWNED', 101, NOW(), 0),
(161, 'profile7.png', 'profile7.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile7.png', 'OWNED', 101, NOW(), 0),
(162, 'profile8.png', 'profile8.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile8.png', 'OWNED', 102, NOW(), 0),
(163, 'profile9.png', 'profile9.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/profile9.png', 'OWNED', 103, NOW(), 0),
-- 피드 post16~30
(164, 'post16.png', 'post16.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post16.png', 'OWNED', 101, NOW(), 0),
(165, 'post17.png', 'post17.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post17.png', 'OWNED', 101, NOW(), 0),
(166, 'post18.png', 'post18.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post18.png', 'OWNED', 101, NOW(), 0),
(167, 'post19.png', 'post19.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post19.png', 'OWNED', 102, NOW(), 0),
(168, 'post20.png', 'post20.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post20.png', 'OWNED', 102, NOW(), 0),
(169, 'post21.png', 'post21.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post21.png', 'OWNED', 102, NOW(), 0),
(170, 'post22.png', 'post22.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post22.png', 'OWNED', 103, NOW(), 0),
(171, 'post23.png', 'post23.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post23.png', 'OWNED', 103, NOW(), 0),
(172, 'post24.png', 'post24.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post24.png', 'OWNED', 103, NOW(), 0),
(173, 'post25.png', 'post25.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post25.png', 'OWNED', 104, NOW(), 0),
(174, 'post26.png', 'post26.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post26.png', 'OWNED', 104, NOW(), 0),
(175, 'post27.png', 'post27.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post27.png', 'OWNED', 104, NOW(), 0),
(176, 'post28.png', 'post28.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post28.png', 'OWNED', 105, NOW(), 0),
(177, 'post29.png', 'post29.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post29.png', 'OWNED', 105, NOW(), 0),
(178, 'post30.png', 'post30.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/post30.png', 'OWNED', 105, NOW(), 0),
-- 스토리 story11~16
(179, 'story11.png', 'story11.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story11.png', 'OWNED', 101, NOW(), 0),
(180, 'story12.png', 'story12.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story12.png', 'OWNED', 101, NOW(), 0),
(181, 'story13.png', 'story13.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story13.png', 'OWNED', 104, NOW(), 0),
(182, 'story14.png', 'story14.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story14.png', 'OWNED', 104, NOW(), 0),
(183, 'story15.png', 'story15.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story15.png', 'OWNED', 105, NOW(), 0),
(184, 'story16.png', 'story16.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/story16.png', 'OWNED', 105, NOW(), 0),
-- 상품 goods3~12 (그리드 왼쪽→오른쪽, 위→아래)
(185, 'goods3.png',  'goods3.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods3.png',  'OWNED', 101, NOW(), 0),
(186, 'goods4.png',  'goods4.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods4.png',  'OWNED', 101, NOW(), 0),
(187, 'goods5.png',  'goods5.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods5.png',  'OWNED', 101, NOW(), 0),
(188, 'goods6.png',  'goods6.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods6.png',  'OWNED', 101, NOW(), 0),
(189, 'goods7.png',  'goods7.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods7.png',  'OWNED', 101, NOW(), 0),
(190, 'goods8.png',  'goods8.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods8.png',  'OWNED', 101, NOW(), 0),
(191, 'goods9.png',  'goods9.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods9.png',  'OWNED', 101, NOW(), 0),
(192, 'goods10.png', 'goods10.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods10.png', 'OWNED', 101, NOW(), 0),
(193, 'goods11.png', 'goods11.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods11.png', 'OWNED', 101, NOW(), 0),
(194, 'goods12.png', 'goods12.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods12.png', 'OWNED', 101, NOW(), 0),
-- 상품 사진을 게시글에 다시 씀. URL은 goods3~12와 같고 file_id만 새로 둔다 (195~224, 글 129~158과 1:1)
(195, 'goods3.png',  'goods3.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods3.png',  'OWNED', 106, NOW(), 0),
(196, 'goods3.png',  'goods3.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods3.png',  'OWNED', 107, NOW(), 0),
(197, 'goods3.png',  'goods3.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods3.png',  'OWNED', 101, NOW(), 0),
(198, 'goods4.png',  'goods4.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods4.png',  'OWNED', 108, NOW(), 0),
(199, 'goods4.png',  'goods4.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods4.png',  'OWNED', 106, NOW(), 0),
(200, 'goods4.png',  'goods4.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods4.png',  'OWNED', 102, NOW(), 0),
(201, 'goods5.png',  'goods5.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods5.png',  'OWNED', 107, NOW(), 0),
(202, 'goods5.png',  'goods5.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods5.png',  'OWNED', 108, NOW(), 0),
(203, 'goods5.png',  'goods5.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods5.png',  'OWNED', 103, NOW(), 0),
(204, 'goods6.png',  'goods6.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods6.png',  'OWNED', 106, NOW(), 0),
(205, 'goods6.png',  'goods6.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods6.png',  'OWNED', 107, NOW(), 0),
(206, 'goods6.png',  'goods6.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods6.png',  'OWNED', 101, NOW(), 0),
(207, 'goods7.png',  'goods7.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods7.png',  'OWNED', 108, NOW(), 0),
(208, 'goods7.png',  'goods7.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods7.png',  'OWNED', 106, NOW(), 0),
(209, 'goods7.png',  'goods7.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods7.png',  'OWNED', 104, NOW(), 0),
(210, 'goods8.png',  'goods8.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods8.png',  'OWNED', 107, NOW(), 0),
(211, 'goods8.png',  'goods8.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods8.png',  'OWNED', 108, NOW(), 0),
(212, 'goods8.png',  'goods8.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods8.png',  'OWNED', 102, NOW(), 0),
(213, 'goods9.png',  'goods9.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods9.png',  'OWNED', 106, NOW(), 0),
(214, 'goods9.png',  'goods9.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods9.png',  'OWNED', 107, NOW(), 0),
(215, 'goods9.png',  'goods9.png',  'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods9.png',  'OWNED', 105, NOW(), 0),
(216, 'goods10.png', 'goods10.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods10.png', 'OWNED', 108, NOW(), 0),
(217, 'goods10.png', 'goods10.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods10.png', 'OWNED', 106, NOW(), 0),
(218, 'goods10.png', 'goods10.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods10.png', 'OWNED', 103, NOW(), 0),
(219, 'goods11.png', 'goods11.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods11.png', 'OWNED', 107, NOW(), 0),
(220, 'goods11.png', 'goods11.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods11.png', 'OWNED', 108, NOW(), 0),
(221, 'goods11.png', 'goods11.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods11.png', 'OWNED', 104, NOW(), 0),
(222, 'goods12.png', 'goods12.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods12.png', 'OWNED', 106, NOW(), 0),
(223, 'goods12.png', 'goods12.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods12.png', 'OWNED', 107, NOW(), 0),
(224, 'goods12.png', 'goods12.png', 'png', 'image/png', 0, 'https://ehfqntuqntu.cdn1.cafe24.com/ultary/goods12.png', 'OWNED', 105, NOW(), 0);

-- ---------- 반려동물 (priority 작을수록 우선. 유저 표시 사진은 그중 프로필 있는 첫 펫) ----------
INSERT INTO `ultary_pet` (
  `pet_id`, `user_no`, `mention_id`, `mention_id_changed_at`, `name`,
  `species`, `breed`, `gender`, `is_neutered`, `birthday`, `profile_file_id`, `priority`, `bio`
) VALUES
(101, 101, 'choco_01', NOW(), '초코', 'DOG', '푸들', 'MALE', 1, '2020-05-01 00:00:00', 160, 1, '산책 좋아함'),
(102, 101, 'mung_01', NOW(), '멍이', 'DOG', '말티즈', 'FEMALE', 0, '2022-01-10 00:00:00', 161, 2, '집돌이'),
(103, 102, 'nabi_01', NOW(), '나비', 'CAT', '코리안숏헤어', 'FEMALE', 1, '2021-03-15 00:00:00', 162, 1, '캣타워 점령 중'),
(104, 103, 'coco_01', NOW(), '코코', 'DOG', '비숑', 'MALE', 1, '2019-08-20 00:00:00', 163, 1, '공놀이'),
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
(103, '냥스타그램', '냥이 일상', NULL, NULL, '고양이 피드용', NULL, 1, 102),
-- 상품 10개. 사진 그리드 왼쪽→오른쪽, 위 줄 다음 아래 줄. content 가 가격
(104, '도넛방석', '포근한 도넛 방석', 'donut_bed_01', NOW(), '29,900원', 'https://example.com/product/donut-bed', 0, 101),
(105, '식기세트', '원목 높이조절 식기 세트', 'wood_bowl_01', NOW(), '34,900원', 'https://example.com/product/wood-bowl', 0, 102),
(106, '체크하네스', '체크 하네스 & 리드줄 세트', 'check_harness_01', NOW(), '28,900원', 'https://example.com/product/check-harness', 0, 103),
(107, '노즈워크', '강아지 노즈워크 장난감', 'nosework_toy_01', NOW(), '15,900원', 'https://example.com/product/nosework', 0, 104),
(108, '털브러쉬', '반려동물 털 제거 브러쉬', 'pet_brush_01', NOW(), '18,900원', 'https://example.com/product/pet-brush', 0, 105),
(109, '반려동물샴푸', '저자극 반려동물 샴푸', 'pet_shampoo_01', NOW(), '22,900원', 'https://example.com/product/pet-shampoo', 0, 101),
(110, '이동가방', '반려동물 이동가방', 'pet_carrier_01', NOW(), '49,900원', 'https://example.com/product/pet-carrier', 0, 102),
(111, '자동급수기', '자동 급수기', 'pet_fountain_01', NOW(), '39,900원', 'https://example.com/product/pet-fountain', 0, 103),
(112, '반려동물블랭킷', '포근한 반려동물 블랭킷', 'pet_blanket_01', NOW(), '24,900원', 'https://example.com/product/pet-blanket', 0, 104),
(113, '반려동물물티슈', '반려동물 전용 물티슈', 'pet_wipes_01', NOW(), '9,900원', 'https://example.com/product/pet-wipes', 0, 105),
(114, '낮잠', NULL, NULL, NULL, NULL, NULL, 0, 101),
(115, '간식', NULL, NULL, NULL, NULL, NULL, 0, 102),
(116, '공원', NULL, NULL, NULL, NULL, NULL, 0, 103),
(117, '집사일상', NULL, NULL, NULL, NULL, NULL, 0, 104);

INSERT INTO `ultary_tag_image` (`tag_image_id`, `tag_id`, `file_id`, `sort_order`) VALUES
(101, 102, 140, 0),
(102, 103, 141, 0),
(103, 104, 185, 0),
(104, 105, 186, 0),
(105, 106, 187, 0),
(106, 107, 188, 0),
(107, 108, 189, 0),
(108, 109, 190, 0),
(109, 110, 191, 0),
(110, 111, 192, 0),
(111, 112, 193, 0),
(112, 113, 194, 0);

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
  `like_count`, `comment_count`, `pin_count`
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
  `like_count`, `comment_count`, `pin_count`
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
  `like_count`, `comment_count`, `pin_count`
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
  `like_count`, `comment_count`, `pin_count`, `created_at`
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

-- ---------- 추가 피드 114~128 (post16~30, 유저 101~105 각 3건) ----------
INSERT INTO `ultary_feed` (
  `feed_id`, `user_no`, `content`, `visibility`,
  `like_count`, `comment_count`, `pin_count`, `created_at`
) VALUES
(114, 101, '초코 간식', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 89 MINUTE)),
(115, 101, '멍이 베개', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 83 MINUTE)),
(116, 101, '달이 낮잠', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 77 MINUTE)),
(117, 102, '나비 창밖', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 71 MINUTE)),
(118, 102, '모모 캣타워', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 65 MINUTE)),
(119, 102, '나비 그루밍', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 59 MINUTE)),
(120, 103, '코코 공원', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 53 MINUTE)),
(121, 103, '토리 창가', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 47 MINUTE)),
(122, 103, '코코 공놀이', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 41 MINUTE)),
(123, 104, '콩이 산책', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 35 MINUTE)),
(124, 104, '콩이 앉기', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 29 MINUTE)),
(125, 104, '콩이 간식', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 23 MINUTE)),
(126, 105, '보리 달리기', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 17 MINUTE)),
(127, 105, '보리 모래', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 11 MINUTE)),
(128, 105, '보리 저녁', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 5 MINUTE));

INSERT INTO `ultary_feed_media` (
  `feed_media_id`, `feed_id`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `sort_order`
) VALUES
(116, 114, 164, 'IMAGE', NULL, NULL, 0),
(117, 115, 165, 'IMAGE', NULL, NULL, 0),
(118, 116, 166, 'IMAGE', NULL, NULL, 0),
(119, 117, 167, 'IMAGE', NULL, NULL, 0),
(120, 118, 168, 'IMAGE', NULL, NULL, 0),
(121, 119, 169, 'IMAGE', NULL, NULL, 0),
(122, 120, 170, 'IMAGE', NULL, NULL, 0),
(123, 121, 171, 'IMAGE', NULL, NULL, 0),
(124, 122, 172, 'IMAGE', NULL, NULL, 0),
(125, 123, 173, 'IMAGE', NULL, NULL, 0),
(126, 124, 174, 'IMAGE', NULL, NULL, 0),
(127, 125, 175, 'IMAGE', NULL, NULL, 0),
(128, 126, 176, 'IMAGE', NULL, NULL, 0),
(129, 127, 177, 'IMAGE', NULL, NULL, 0),
(130, 128, 178, 'IMAGE', NULL, NULL, 0);

INSERT INTO `ultary_feed_pet` (
  `feed_pet_id`, `feed_id`, `pet_id`, `added_by_user_no`, `role`, `is_main`
) VALUES
(115, 114, 101, 101, 'COLLABORATOR', 1),
(116, 115, 102, 101, 'COLLABORATOR', 1),
(117, 116, 108, 101, 'COLLABORATOR', 1),
(118, 117, 103, 102, 'COLLABORATOR', 1),
(119, 118, 109, 102, 'COLLABORATOR', 1),
(120, 119, 103, 102, 'COLLABORATOR', 1),
(121, 120, 104, 103, 'COLLABORATOR', 1),
(122, 121, 105, 103, 'COLLABORATOR', 1),
(123, 122, 104, 103, 'COLLABORATOR', 1),
(124, 123, 106, 104, 'COLLABORATOR', 1),
(125, 124, 106, 104, 'COLLABORATOR', 1),
(126, 125, 106, 104, 'COLLABORATOR', 1),
(127, 126, 107, 105, 'COLLABORATOR', 1),
(128, 127, 107, 105, 'COLLABORATOR', 1),
(129, 128, 107, 105, 'COLLABORATOR', 1);

INSERT INTO `ultary_feed_like` (`feed_like_id`, `feed_id`, `user_no`) VALUES
(101, 101, 102),
(102, 102, 101);

INSERT INTO `ultary_feed_pin` (`feed_pin_id`, `feed_id`, `user_no`) VALUES
(101, 102, 101);

INSERT INTO `ultary_feed_save` (`feed_save_id`, `feed_id`, `user_no`, `created_at`) VALUES
(101, 103, 101, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(102, 102, 101, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(103, 106, 101, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(104, 108, 101, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(105, 112, 101, DATE_SUB(NOW(), INTERVAL 1 HOUR));

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

-- ---------- 스토리 (101 본인 3 + 주민 102·103 각 4 + 104 2 + 이웃 105 3) ----------
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
 DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 45 MINUTE), INTERVAL 24 HOUR)),
-- story11~16: 101 2장, 104 2장, 105 2장
(111, 101, 179, 'IMAGE', NULL, NULL, '초코 오늘',
 DATE_SUB(NOW(), INTERVAL 24 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 24 MINUTE), INTERVAL 24 HOUR)),
(112, 101, 180, 'IMAGE', NULL, NULL, '멍이 소파',
 DATE_SUB(NOW(), INTERVAL 12 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 12 MINUTE), INTERVAL 24 HOUR)),
(113, 104, 181, 'IMAGE', NULL, NULL, '콩이 첫 스토리',
 DATE_SUB(NOW(), INTERVAL 22 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 22 MINUTE), INTERVAL 24 HOUR)),
(114, 104, 182, 'IMAGE', NULL, NULL, '콩이 저녁',
 DATE_SUB(NOW(), INTERVAL 8 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 8 MINUTE), INTERVAL 24 HOUR)),
(115, 105, 183, 'IMAGE', NULL, NULL, '보리 해변',
 DATE_SUB(NOW(), INTERVAL 18 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 18 MINUTE), INTERVAL 24 HOUR)),
(116, 105, 184, 'IMAGE', NULL, NULL, '보리 집앞',
 DATE_SUB(NOW(), INTERVAL 4 MINUTE), DATE_ADD(DATE_SUB(NOW(), INTERVAL 4 MINUTE), INTERVAL 24 HOUR));

-- ---------- 게시글 본문에 태그. 상품 10개는 각 글에 한 번씩 ----------
UPDATE `ultary_feed` SET `content` = '초코 낮잠 #낮잠 #도넛방석' WHERE `feed_id` = 104;
UPDATE `ultary_feed` SET `content` = '멍이 소파 #집사일상' WHERE `feed_id` = 105;
UPDATE `ultary_feed` SET `content` = '나비 창가 #냥스타그램 #자동급수기' WHERE `feed_id` = 106;
UPDATE `ultary_feed` SET `content` = '나비 박스 #냥스타그램' WHERE `feed_id` = 107;
UPDATE `ultary_feed` SET `content` = '코코 산책 #산책' WHERE `feed_id` = 108;
UPDATE `ultary_feed` SET `content` = '토리 햇살 #냥스타그램' WHERE `feed_id` = 109;
UPDATE `ultary_feed` SET `content` = '콩이 첫 산책 #산책' WHERE `feed_id` = 110;
UPDATE `ultary_feed` SET `content` = '콩이 간식 #간식 #식기세트' WHERE `feed_id` = 111;
UPDATE `ultary_feed` SET `content` = '보리 공원 #공원 #산책' WHERE `feed_id` = 112;
UPDATE `ultary_feed` SET `content` = '보리 집 #집사일상' WHERE `feed_id` = 113;
UPDATE `ultary_feed` SET `content` = '초코 간식 #간식 #노즈워크' WHERE `feed_id` = 114;
UPDATE `ultary_feed` SET `content` = '멍이 베개 #도넛방석' WHERE `feed_id` = 115;
UPDATE `ultary_feed` SET `content` = '달이 낮잠 #낮잠 #반려동물블랭킷' WHERE `feed_id` = 116;
UPDATE `ultary_feed` SET `content` = '나비 창밖 #냥스타그램' WHERE `feed_id` = 117;
UPDATE `ultary_feed` SET `content` = '모모 캣타워 #냥스타그램' WHERE `feed_id` = 118;
UPDATE `ultary_feed` SET `content` = '나비 그루밍 #반려동물샴푸 #냥스타그램' WHERE `feed_id` = 119;
UPDATE `ultary_feed` SET `content` = '코코 공원 #산책 #공원' WHERE `feed_id` = 120;
UPDATE `ultary_feed` SET `content` = '토리 창가 #냥스타그램' WHERE `feed_id` = 121;
UPDATE `ultary_feed` SET `content` = '코코 공놀이 #간식 #털브러쉬' WHERE `feed_id` = 122;
UPDATE `ultary_feed` SET `content` = '콩이 산책 #산책 #체크하네스' WHERE `feed_id` = 123;
UPDATE `ultary_feed` SET `content` = '콩이 앉기 #집사일상' WHERE `feed_id` = 124;
UPDATE `ultary_feed` SET `content` = '콩이 간식 #간식' WHERE `feed_id` = 125;
UPDATE `ultary_feed` SET `content` = '보리 달리기 #산책 #이동가방' WHERE `feed_id` = 126;
UPDATE `ultary_feed` SET `content` = '보리 모래 #공원' WHERE `feed_id` = 127;
UPDATE `ultary_feed` SET `content` = '보리 저녁 #반려동물물티슈 #집사일상' WHERE `feed_id` = 128;

INSERT INTO `ultary_feed_tag` (`feed_tag_id`, `feed_id`, `tag_id`) VALUES
(105, 104, 114), (106, 104, 104),
(107, 105, 117),
(108, 106, 103), (109, 106, 111),
(110, 107, 103),
(111, 108, 101),
(112, 109, 103),
(113, 110, 101),
(114, 111, 115), (115, 111, 105),
(116, 112, 116), (117, 112, 101),
(118, 113, 117),
(119, 114, 115), (120, 114, 107),
(121, 115, 104),
(122, 116, 114), (123, 116, 112),
(124, 117, 103),
(125, 118, 103),
(126, 119, 109), (127, 119, 103),
(128, 120, 101), (129, 120, 116),
(130, 121, 103),
(131, 122, 115), (132, 122, 108),
(133, 123, 101), (134, 123, 106),
(135, 124, 117),
(136, 125, 115),
(137, 126, 101), (138, 126, 110),
(139, 127, 116),
(140, 128, 113), (141, 128, 117);

-- ---------- 상품 광고·후기 129~158 ----------
-- 광고 계정 106~108은 상품 글만. 일반 유저 글은 후기이고 상품 사진을 같이 단다.
-- 태그 이미지(185~194)와 file_id를 공유하지 않는다.
INSERT INTO `ultary_feed` (
  `feed_id`, `user_no`, `content`, `visibility`,
  `like_count`, `comment_count`, `pin_count`, `created_at`
) VALUES
(129, 106, '포근한 도넛 방석. 세탁 가능한 커버 #도넛방석', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 36 HOUR)),
(130, 107, '도넛 방석 29,900원. 작은 강아지 낮잠용 #도넛방석', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 38 HOUR)),
(131, 101, '도넛 방석 깔아주니까 초코가 바로 눕는다 #도넛방석 #낮잠', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 40 HOUR)),
(132, 108, '원목 높이조절 식기 세트 #식기세트', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 42 HOUR)),
(133, 106, '식기 높이를 맞추면 목 부담이 줄어듭니다 #식기세트', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 44 HOUR)),
(134, 102, '높이 조절 식기 바꾸니 나비 목 각도가 편해 보인다 #식기세트', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 46 HOUR)),
(135, 107, '체크 하네스와 리드줄 세트 #체크하네스', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 48 HOUR)),
(136, 108, '산책용 체크 하네스 28,900원 #체크하네스', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 50 HOUR)),
(137, 103, '체크 하네스 채워 보고 공원 한 바퀴. 코코가 잘 따라온다 #체크하네스 #산책', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 52 HOUR)),
(138, 106, '노즈워크 장난감. 간식을 숨겨 주세요 #노즈워크', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 54 HOUR)),
(139, 107, '강아지 노즈워크 매트 15,900원 #노즈워크', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 56 HOUR)),
(140, 101, '노즈워크 장난감에 간식 숨기니까 멍이가 한참을 찾는다 #노즈워크 #간식', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 58 HOUR)),
(141, 108, '빠지는 털을 모아 주는 브러쉬 #털브러쉬', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 60 HOUR)),
(142, 106, '반려동물 털 제거 브러쉬 18,900원 #털브러쉬', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 62 HOUR)),
(143, 104, '털 브러쉬로 콩이 빗겨 줬더니 소파 털이 줄었다 #털브러쉬', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 64 HOUR)),
(144, 107, '저자극 반려동물 샴푸 #반려동물샴푸', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 66 HOUR)),
(145, 108, '목욕 후 피부 당김이 적은 샴푸 22,900원 #반려동물샴푸', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 68 HOUR)),
(146, 102, '저자극 샴푸로 모모 목욕. 향이 순하다 #반려동물샴푸', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 70 HOUR)),
(147, 106, '이동이 편한 반려동물 가방 #이동가방', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 72 HOUR)),
(148, 107, '병원·여행용 이동가방 49,900원 #이동가방', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 74 HOUR)),
(149, 105, '이동가방에 보리 태우고 병원 다녀왔다. 흔들림이 덜하다 #이동가방', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 76 HOUR)),
(150, 108, '흐르는 물 자동 급수기 #자동급수기', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 78 HOUR)),
(151, 106, '필터 교체형 자동 급수기 39,900원 #자동급수기', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 80 HOUR)),
(152, 103, '자동 급수기 놓고 나니 토리가 물 마시는 횟수가 늘었다 #자동급수기', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 82 HOUR)),
(153, 107, '포근한 반려동물 블랭킷 #반려동물블랭킷', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 84 HOUR)),
(154, 108, '세탁 가능한 블랭킷 24,900원 #반려동물블랭킷', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 86 HOUR)),
(155, 104, '블랭킷 덮어주니 콩이가 그 위에서만 잔다 #반려동물블랭킷 #낮잠', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 88 HOUR)),
(156, 106, '발바닥용 반려동물 물티슈 #반려동물물티슈', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 90 HOUR)),
(157, 107, '무향 물티슈 9,900원 #반려동물물티슈', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 92 HOUR)),
(158, 105, '산책 다녀와서 발 물티슈로 닦았다. 보리가 싫어하지 않는다 #반려동물물티슈', 'PUBLIC', 0, 0, 0, DATE_SUB(NOW(), INTERVAL 94 HOUR));

INSERT INTO `ultary_feed_media` (
  `feed_media_id`, `feed_id`, `file_id`, `media_type`,
  `thumbnail_file_id`, `duration_sec`, `sort_order`
) VALUES
(131, 129, 195, 'IMAGE', NULL, NULL, 0),
(132, 130, 196, 'IMAGE', NULL, NULL, 0),
(133, 131, 197, 'IMAGE', NULL, NULL, 0),
(134, 132, 198, 'IMAGE', NULL, NULL, 0),
(135, 133, 199, 'IMAGE', NULL, NULL, 0),
(136, 134, 200, 'IMAGE', NULL, NULL, 0),
(137, 135, 201, 'IMAGE', NULL, NULL, 0),
(138, 136, 202, 'IMAGE', NULL, NULL, 0),
(139, 137, 203, 'IMAGE', NULL, NULL, 0),
(140, 138, 204, 'IMAGE', NULL, NULL, 0),
(141, 139, 205, 'IMAGE', NULL, NULL, 0),
(142, 140, 206, 'IMAGE', NULL, NULL, 0),
(143, 141, 207, 'IMAGE', NULL, NULL, 0),
(144, 142, 208, 'IMAGE', NULL, NULL, 0),
(145, 143, 209, 'IMAGE', NULL, NULL, 0),
(146, 144, 210, 'IMAGE', NULL, NULL, 0),
(147, 145, 211, 'IMAGE', NULL, NULL, 0),
(148, 146, 212, 'IMAGE', NULL, NULL, 0),
(149, 147, 213, 'IMAGE', NULL, NULL, 0),
(150, 148, 214, 'IMAGE', NULL, NULL, 0),
(151, 149, 215, 'IMAGE', NULL, NULL, 0),
(152, 150, 216, 'IMAGE', NULL, NULL, 0),
(153, 151, 217, 'IMAGE', NULL, NULL, 0),
(154, 152, 218, 'IMAGE', NULL, NULL, 0),
(155, 153, 219, 'IMAGE', NULL, NULL, 0),
(156, 154, 220, 'IMAGE', NULL, NULL, 0),
(157, 155, 221, 'IMAGE', NULL, NULL, 0),
(158, 156, 222, 'IMAGE', NULL, NULL, 0),
(159, 157, 223, 'IMAGE', NULL, NULL, 0),
(160, 158, 224, 'IMAGE', NULL, NULL, 0);

INSERT INTO `ultary_feed_pet` (
  `feed_pet_id`, `feed_id`, `pet_id`, `added_by_user_no`, `role`, `is_main`
) VALUES
(130, 131, 101, 101, 'COLLABORATOR', 1),
(131, 134, 103, 102, 'COLLABORATOR', 1),
(132, 137, 104, 103, 'COLLABORATOR', 1),
(133, 140, 102, 101, 'COLLABORATOR', 1),
(134, 143, 106, 104, 'COLLABORATOR', 1),
(135, 146, 109, 102, 'COLLABORATOR', 1),
(136, 149, 107, 105, 'COLLABORATOR', 1),
(137, 152, 105, 103, 'COLLABORATOR', 1),
(138, 155, 106, 104, 'COLLABORATOR', 1),
(139, 158, 107, 105, 'COLLABORATOR', 1);

INSERT INTO `ultary_feed_tag` (`feed_tag_id`, `feed_id`, `tag_id`) VALUES
(142, 129, 104), (143, 130, 104), (144, 131, 104), (145, 131, 114),
(146, 132, 105), (147, 133, 105), (148, 134, 105),
(149, 135, 106), (150, 136, 106), (151, 137, 106), (152, 137, 101),
(153, 138, 107), (154, 139, 107), (155, 140, 107), (156, 140, 115),
(157, 141, 108), (158, 142, 108), (159, 143, 108),
(160, 144, 109), (161, 145, 109), (162, 146, 109),
(163, 147, 110), (164, 148, 110), (165, 149, 110),
(166, 150, 111), (167, 151, 111), (168, 152, 111),
(169, 153, 112), (170, 154, 112), (171, 155, 112), (172, 155, 114),
(173, 156, 113), (174, 157, 113), (175, 158, 113);

UPDATE `ultary_tag` t
INNER JOIN (
  SELECT `tag_id`, COUNT(*) AS cnt
  FROM `ultary_feed_tag`
  WHERE `is_deleted` = 0 AND `tag_id` BETWEEN 101 AND 117
  GROUP BY `tag_id`
) x ON x.tag_id = t.tag_id
SET t.use_count = x.cnt;

-- 댓글이 없던 글 + 좋아요가 없던 글
INSERT INTO `ultary_feed_comment` (`feed_comment_id`, `feed_id`, `user_no`, `content`) VALUES
(221, 107, 101, '박스 안이 제일 좋은가 봐'),
(222, 108, 102, '코코 산책 코스 좋다'),
(223, 109, 105, '토리 햇살 받는 표정'),
(224, 114, 102, '초코 간식 시간인가'),
(225, 115, 103, '멍이 베개 점령'),
(226, 116, 102, '달이 자는 얼굴'),
(227, 117, 101, '나비 창밖 구경'),
(228, 118, 103, '모모 캣타워 위'),
(229, 119, 105, '그루밍하는 나비'),
(230, 120, 101, '코코 공원 신났다'),
(231, 121, 102, '토리 창가 단골'),
(232, 122, 104, '공놀이 한 판'),
(233, 123, 103, '콩이 하네스 잘 어울려'),
(234, 124, 101, '콩이 앉은 자세'),
(235, 125, 102, '간식 눈빛이다'),
(236, 126, 103, '보리 달리기 빨라'),
(237, 127, 101, '모래 놀이'),
(238, 128, 102, '저녁 보리');

INSERT INTO `ultary_feed_reply` (`feed_reply_id`, `feed_comment_id`, `user_no`, `content`) VALUES
(212, 221, 102, '매일 그 박스야'),
(213, 224, 101, '오늘 새로 샀어'),
(214, 230, 103, '성남 중앙공원'),
(215, 233, 104, '처음 채워 봤어'),
(216, 236, 105, '해변에서 뛰었어');

INSERT INTO `ultary_feed_like` (`feed_like_id`, `feed_id`, `user_no`) VALUES
(260, 106, 201), (261, 106, 203), (262, 106, 205),
(263, 107, 201), (264, 107, 203), (265, 107, 205),
(266, 108, 201), (267, 108, 203), (268, 108, 205),
(269, 109, 201), (270, 109, 203), (271, 109, 205),
(272, 110, 201), (273, 110, 203), (274, 110, 205),
(275, 111, 201), (276, 111, 203), (277, 111, 205),
(278, 112, 201), (279, 112, 203), (280, 112, 205),
(281, 113, 201), (282, 113, 203), (283, 113, 205),
(284, 114, 201), (285, 114, 203), (286, 114, 205),
(287, 115, 201), (288, 115, 203), (289, 115, 205),
(290, 116, 201), (291, 116, 203), (292, 116, 205),
(293, 117, 201), (294, 117, 203), (295, 117, 205),
(296, 118, 201), (297, 118, 203), (298, 118, 205),
(299, 119, 201), (300, 119, 203), (301, 119, 205),
(302, 120, 201), (303, 120, 203), (304, 120, 205),
(305, 121, 201), (306, 121, 203), (307, 121, 205),
(308, 122, 201), (309, 122, 203), (310, 122, 205),
(311, 123, 201), (312, 123, 203), (313, 123, 205),
(314, 124, 201), (315, 124, 203), (316, 124, 205),
(317, 125, 201), (318, 125, 203), (319, 125, 205),
(320, 126, 201), (321, 126, 203), (322, 126, 205),
(323, 127, 201), (324, 127, 203), (325, 127, 205),
(326, 128, 201), (327, 128, 203), (328, 128, 205);

INSERT INTO `ultary_feed_like` (`feed_like_id`, `feed_id`, `user_no`) VALUES
(330, 129, 201), (331, 129, 203), (332, 129, 205),
(333, 130, 201), (334, 130, 203), (335, 130, 205),
(336, 131, 201), (337, 131, 203), (338, 131, 205),
(339, 132, 201), (340, 132, 203), (341, 132, 205),
(342, 133, 201), (343, 133, 203), (344, 133, 205),
(345, 134, 201), (346, 134, 203), (347, 134, 205),
(348, 135, 201), (349, 135, 203), (350, 135, 205),
(351, 136, 201), (352, 136, 203), (353, 136, 205),
(354, 137, 201), (355, 137, 203), (356, 137, 205),
(357, 138, 201), (358, 138, 203), (359, 138, 205),
(360, 139, 201), (361, 139, 203), (362, 139, 205),
(363, 140, 201), (364, 140, 203), (365, 140, 205),
(366, 141, 201), (367, 141, 203), (368, 141, 205),
(369, 142, 201), (370, 142, 203), (371, 142, 205),
(372, 143, 201), (373, 143, 203), (374, 143, 205),
(375, 144, 201), (376, 144, 203), (377, 144, 205),
(378, 145, 201), (379, 145, 203), (380, 145, 205),
(381, 146, 201), (382, 146, 203), (383, 146, 205),
(384, 147, 201), (385, 147, 203), (386, 147, 205),
(387, 148, 201), (388, 148, 203), (389, 148, 205),
(390, 149, 201), (391, 149, 203), (392, 149, 205),
(393, 150, 201), (394, 150, 203), (395, 150, 205),
(396, 151, 201), (397, 151, 203), (398, 151, 205),
(399, 152, 201), (400, 152, 203), (401, 152, 205),
(402, 153, 201), (403, 153, 203), (404, 153, 205),
(405, 154, 201), (406, 154, 203), (407, 154, 205),
(408, 155, 201), (409, 155, 203), (410, 155, 205),
(411, 156, 201), (412, 156, 203), (413, 156, 205),
(414, 157, 201), (415, 157, 203), (416, 157, 205),
(417, 158, 201), (418, 158, 203), (419, 158, 205);

UPDATE `ultary_feed` f
INNER JOIN (
  SELECT `feed_id`, COUNT(*) AS cnt
  FROM `ultary_feed_like`
  WHERE `is_deleted` = 0 AND `feed_id` BETWEEN 106 AND 158
  GROUP BY `feed_id`
) x ON x.feed_id = f.feed_id
SET f.like_count = x.cnt;

UPDATE `ultary_feed` f
INNER JOIN (
  SELECT `feed_id`, COUNT(*) AS cnt
  FROM `ultary_feed_comment`
  WHERE `is_deleted` = 0 AND `feed_id` BETWEEN 107 AND 128
  GROUP BY `feed_id`
) x ON x.feed_id = f.feed_id
SET f.comment_count = x.cnt;

-- 이웃 목록이 보이도록 구경 계정과 ACCEPTED. 기존 PENDING(알림 수락)은 유지
INSERT INTO `ultary_neighbor` (
  `neighbor_id`, `requester_user_no`, `receiver_user_no`, `pair_key`,
  `status`, `requested_at`, `accepted_at`
) VALUES
(109, 101, 201, '101:201', 'ACCEPTED', NOW(), NOW()),
(110, 101, 202, '101:202', 'ACCEPTED', NOW(), NOW()),
(111, 101, 203, '101:203', 'ACCEPTED', NOW(), NOW()),
(112, 101, 204, '101:204', 'ACCEPTED', NOW(), NOW()),
(113, 101, 205, '101:205', 'ACCEPTED', NOW(), NOW()),
(114, 101, 206, '101:206', 'ACCEPTED', NOW(), NOW()),
(115, 207, 101, '101:207', 'PENDING', NOW(), NULL),
(116, 208, 101, '101:208', 'PENDING', NOW(), NULL),
(117, 102, 209, '102:209', 'ACCEPTED', NOW(), NOW()),
(118, 102, 210, '102:210', 'ACCEPTED', NOW(), NOW()),
(119, 103, 211, '103:211', 'ACCEPTED', NOW(), NOW()),
(120, 103, 212, '103:212', 'ACCEPTED', NOW(), NOW()),
(121, 101, 106, '101:106', 'ACCEPTED', NOW(), NOW()),
(122, 101, 107, '101:107', 'ACCEPTED', NOW(), NOW()),
(123, 101, 108, '101:108', 'ACCEPTED', NOW(), NOW()),
(124, 102, 106, '102:106', 'ACCEPTED', NOW(), NOW()),
(125, 103, 107, '103:107', 'ACCEPTED', NOW(), NOW()),
(126, 105, 108, '105:108', 'ACCEPTED', NOW(), NOW());

INSERT INTO `ultary_user_privacy` (
  `user_no`, `private_account`, `feed_visibility`, `story_visibility`,
  `neighbor_request`, `allow_comment`, `allow_mention`, `allow_tag`
) VALUES
(101, 0, 'PUBLIC', 'NEIGHBORS', 1, 1, 1, 1),
(102, 0, 'NEIGHBORS', 'NEIGHBORS', 1, 1, 1, 1),
(103, 0, 'PUBLIC', 'PUBLIC', 1, 1, 1, 1),
(104, 0, 'PUBLIC', 'NEIGHBORS', 0, 1, 1, 1),
(105, 1, 'PUBLIC', 'NEIGHBORS', 1, 0, 1, 1),
(106, 0, 'PUBLIC', 'PUBLIC', 1, 1, 1, 1),
(107, 0, 'PUBLIC', 'PUBLIC', 1, 1, 1, 1),
(108, 0, 'PUBLIC', 'PUBLIC', 1, 1, 1, 1);

-- 스토리 위 글자·펫 태그·공감·조회
INSERT INTO `ultary_story_text` (
  `story_text_id`, `story_id`, `content`, `font_size`, `is_bold`, `color`, `pos_x`, `pos_y`, `sort_order`
) VALUES
(101, 111, '오늘 산책', 20, 1, '#FFFFFF', 50.00, 18.00, 0),
(102, 102, '낮잠 중', 16, 0, '#FFFFFF', 50.00, 80.00, 0),
(103, 103, '공원', 24, 1, '#FFFFFF', 30.00, 40.00, 0),
(104, 116, '집 앞', 16, 0, '#FFFFFF', 70.00, 75.00, 0);

INSERT INTO `ultary_story_mention` (
  `story_mention_id`, `story_id`, `pet_id`, `pos_x`, `pos_y`, `sort_order`, `added_by_user_no`
) VALUES
(101, 101, 101, 40.00, 60.00, 0, 101),
(102, 111, 101, 48.00, 55.00, 0, 101),
(103, 112, 102, 52.00, 62.00, 0, 101),
(104, 102, 103, 46.00, 50.00, 0, 102),
(105, 105, 109, 55.00, 48.00, 0, 102),
(106, 103, 104, 42.00, 58.00, 0, 103),
(107, 113, 106, 50.00, 60.00, 0, 104),
(108, 114, 106, 44.00, 52.00, 0, 104),
(109, 115, 107, 60.00, 70.00, 0, 105),
(110, 116, 107, 38.00, 64.00, 0, 105);

INSERT INTO `ultary_story_like` (`story_like_id`, `story_id`, `user_no`) VALUES
(101, 102, 101),
(102, 106, 101),
(103, 108, 101),
(104, 115, 101),
(105, 101, 102),
(106, 111, 102),
(107, 116, 102),
(108, 104, 103),
(109, 112, 103),
(110, 113, 105);

INSERT INTO `ultary_story_view` (`story_view_id`, `story_id`, `viewer_user_no`) VALUES
(101, 102, 101),
(102, 106, 101),
(103, 101, 102),
(104, 111, 102),
(105, 104, 103),
(106, 113, 101);

ALTER TABLE `ultary_user` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_file` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_pet` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_tag` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_tag_image` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_feed_media` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_feed_media_mention` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_pet` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_tag` AUTO_INCREMENT = 300;
ALTER TABLE `ultary_feed_like` AUTO_INCREMENT = 500;
ALTER TABLE `ultary_feed_comment_like` AUTO_INCREMENT = 400;
ALTER TABLE `ultary_feed_reply_like` AUTO_INCREMENT = 400;
ALTER TABLE `ultary_feed_pin` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_feed_save` AUTO_INCREMENT = 200;
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
