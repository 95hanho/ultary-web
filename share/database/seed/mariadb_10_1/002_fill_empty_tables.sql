-- 비어 있던 테이블용 샘플. 운영에서는 실행하지 않음.
-- 대상: admin, user_block, search_history, pet_tag_history, notification_setting, report, ai_request_log
-- 이 파일의 id 범위만 지우고 다시 넣는다. 다른 데이터는 유지.
-- 비밀번호는 시드 유저와 같다: {noop}Test1234!

SET NAMES utf8mb4;

DELETE FROM `ultary_report` WHERE `report_id` BETWEEN 101 AND 110;
DELETE FROM `ultary_ai_request_log` WHERE `ai_request_id` BETWEEN 101 AND 110;
DELETE FROM `ultary_user_block` WHERE `user_block_id` BETWEEN 101 AND 120;
DELETE FROM `ultary_user_search_history` WHERE `user_search_history_id` BETWEEN 101 AND 130;
DELETE FROM `ultary_user_pet_tag_history` WHERE `user_pet_tag_history_id` BETWEEN 101 AND 130;
DELETE FROM `ultary_notification_setting` WHERE `user_no` BETWEEN 101 AND 105;
DELETE FROM `ultary_admin` WHERE `admin_no` IN (1, 2);

INSERT INTO `ultary_admin` (
  `admin_no`, `login_id`, `password`, `name`, `role`, `status`, `last_login_at`
) VALUES
(1, 'admin', '{noop}Test1234!', '관리자', 'SUPER', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 'operator', '{noop}Test1234!', '운영자', 'OPERATOR', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 3 HOUR));

INSERT INTO `ultary_user_block` (
  `user_block_id`, `blocker_user_no`, `blocked_user_no`, `reason`, `created_at`
) VALUES
(101, 101, 201, '스팸', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(102, 101, 202, '불쾌한 댓글', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(103, 101, 203, NULL, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(104, 102, 204, '반복 광고', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(105, 102, 205, NULL, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(106, 103, 206, '스토리 도배', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(107, 104, 201, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(108, 105, 203, '원치 않는 언급', DATE_SUB(NOW(), INTERVAL 8 HOUR));

INSERT INTO `ultary_user_search_history` (
  `user_search_history_id`, `user_no`, `target_user_no`, `searched_at`
) VALUES
(101, 101, 102, DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
(102, 101, 103, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(103, 101, 104, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
(104, 101, 105, DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
(105, 102, 101, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(106, 102, 103, DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
(107, 102, 105, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(108, 103, 101, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(109, 103, 102, DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(110, 103, 104, DATE_SUB(NOW(), INTERVAL 40 MINUTE)),
(111, 104, 101, DATE_SUB(NOW(), INTERVAL 50 MINUTE)),
(112, 104, 105, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(113, 105, 101, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
(114, 105, 102, DATE_SUB(NOW(), INTERVAL 35 MINUTE)),
(115, 105, 103, DATE_SUB(NOW(), INTERVAL 3 HOUR));

INSERT INTO `ultary_user_pet_tag_history` (
  `user_pet_tag_history_id`, `user_no`, `pet_id`, `used_at`
) VALUES
(101, 101, 103, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(102, 101, 104, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(103, 101, 107, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(104, 102, 101, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(105, 102, 104, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(106, 102, 108, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(107, 103, 102, DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
(108, 103, 106, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(109, 103, 107, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(110, 104, 101, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(111, 104, 103, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(112, 104, 109, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(113, 105, 104, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(114, 105, 105, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(115, 105, 108, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO `ultary_notification_setting` (
  `user_no`, `neighbor`, `like_post`, `like_comment`, `like_reply`,
  `comment_on_post`, `reply_on_comment`, `mention`, `tag_post`, `tag_story`, `story_react`
) VALUES
(101, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
(102, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0),
(103, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1),
(104, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1),
(105, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1);

INSERT INTO `ultary_report` (
  `report_id`, `reporter_user_no`, `target_type`,
  `target_user_no`, `target_pet_id`, `target_feed_id`, `target_comment_id`, `target_reply_id`,
  `reason`, `status`, `admin_no`, `processed_at`, `created_at`
) VALUES
(101, 101, 'USER', 201, NULL, NULL, NULL, NULL, 'SPAM', 'REQUESTED', NULL, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(102, 102, 'PET', NULL, 104, NULL, NULL, NULL, 'IMPERSONATION', 'ON_HOLD', 1, NULL, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(103, 103, 'FEED', NULL, NULL, 102, NULL, NULL, 'SPAM', 'DELETED', 1, DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(104, 104, 'COMMENT', NULL, NULL, NULL, 201, NULL, 'ABUSE', 'REJECTED', 2, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(105, 105, 'REPLY', NULL, NULL, NULL, NULL, 201, 'ABUSE', 'REQUESTED', NULL, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE));

INSERT INTO `ultary_ai_request_log` (
  `ai_request_id`, `user_no`, `feature_type`, `target_feed_id`, `target_pet_id`,
  `prompt`, `result`, `model_name`, `used_token_count`, `status`, `error_message`, `created_at`
) VALUES
(101, 101, 'FEED_CAPTION', 101, NULL, '산책 사진 문구', '오늘도 한강 산책', 'seed-model', 120, 'SUCCESS', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(102, 102, 'HASHTAG', 102, NULL, '고양이 낮잠', '#낮잠 #고양이', 'seed-model', 40, 'SUCCESS', NULL, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(103, 101, 'PET_PROFILE', NULL, 101, '강아지 소개', '산책을 좋아하는 초코', 'seed-model', 80, 'SUCCESS', NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(104, 103, 'COMMENT_FILTER', 103, NULL, '댓글 검사', NULL, 'seed-model', 30, 'FAILED', 'timeout', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
(105, 104, 'ALT_TEXT', 110, NULL, '사진 설명', NULL, 'seed-model', NULL, 'PENDING', NULL, DATE_SUB(NOW(), INTERVAL 10 MINUTE));

ALTER TABLE `ultary_admin` AUTO_INCREMENT = 10;
ALTER TABLE `ultary_user_block` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_user_search_history` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_user_pet_tag_history` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_report` AUTO_INCREMENT = 200;
ALTER TABLE `ultary_ai_request_log` AUTO_INCREMENT = 200;
