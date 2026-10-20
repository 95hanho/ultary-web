-- schema v31 -> v32. Immediate publication; durable, versioned AI moderation.
-- Apply once after 025_content_max_100.sql. No existing content is removed.
CREATE TABLE `ultary_ai_moderation_state` (
  `target_type` VARCHAR(10) NOT NULL,
  `target_id` INT(11) NOT NULL,
  `latest_version` BIGINT NOT NULL DEFAULT 0,
  `approved_version` BIGINT NOT NULL DEFAULT 0,
  `approved_content` VARCHAR(100) NULL,
  `has_approved` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE `ultary_ai_moderation_job` (
  `job_id` BIGINT NOT NULL AUTO_INCREMENT,
  `target_type` VARCHAR(10) NOT NULL,
  `target_id` INT(11) NOT NULL,
  `feed_id` INT(11) NOT NULL,
  `user_no` INT(11) NOT NULL,
  `content_version` BIGINT NOT NULL,
  `operation` VARCHAR(10) NOT NULL,
  `content` VARCHAR(100) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `attempt_count` INT NOT NULL DEFAULT 0,
  `next_attempt_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lease_until` DATETIME NULL,
  `claim_token` VARCHAR(36) NULL,
  `last_error_code` VARCHAR(100) NULL,
  `last_error` VARCHAR(1000) NULL,
  `result_action` VARCHAR(20) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `finished_at` DATETIME NULL,
  PRIMARY KEY (`job_id`),
  UNIQUE KEY `UK_ai_moderation_version` (`target_type`, `target_id`, `content_version`),
  KEY `IDX_ai_moderation_poll` (`status`, `next_attempt_at`, `lease_until`),
  KEY `IDX_ai_moderation_user` (`user_no`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

ALTER TABLE `ultary_ai_request_log`
  ADD COLUMN `moderation_job_id` BIGINT NULL,
  ADD COLUMN `target_type` VARCHAR(10) NULL,
  ADD COLUMN `target_id` INT(11) NULL,
  ADD COLUMN `content_version` BIGINT NULL,
  ADD COLUMN `attempt_no` INT NULL,
  ADD COLUMN `latency_ms` BIGINT NULL,
  ADD COLUMN `http_status` INT NULL,
  ADD COLUMN `error_code` VARCHAR(100) NULL,
  ADD KEY `IDX_ai_request_job` (`moderation_job_id`, `attempt_no`);

ALTER TABLE `ultary_notification`
  MODIFY COLUMN `type` ENUM('NEIGHBOR_REQUEST','FEED_LIKE','COMMENT_LIKE','REPLY_LIKE','FEED_COMMENT','COMMENT_MENTION','REPLY_MENTION','FEED_TAG','STORY_TAG','STORY_LIKE','AI_MODERATION') NOT NULL;
