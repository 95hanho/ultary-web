-- schema v32 -> v33. 로그인 기기별 세션과 최초 로그인 시각을 보존한다.
-- 026_async_moderation.sql 이후 1회 실행. 기존 토큰의 유효 상태는 바꾸지 않는다.
ALTER TABLE `ultary_token`
  ADD COLUMN `session_id` CHAR(36) NULL DEFAULT NULL AFTER `admin_no`,
  ADD COLUMN `logged_in_at` DATETIME NULL DEFAULT NULL AFTER `session_id`,
  ADD KEY `IDX_ultary_token_user_session` (`user_no`, `session_id`),
  ADD KEY `IDX_ultary_token_admin_session` (`admin_no`, `session_id`);

-- 기존 토큰에는 세션 claim이 없으므로 DB 토큰별로 식별자를 부여한다.
UPDATE `ultary_token`
SET `session_id` = UUID(), `logged_in_at` = `created_at`
WHERE `session_id` IS NULL;
