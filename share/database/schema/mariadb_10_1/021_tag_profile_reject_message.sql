-- schema v26 -> v27
-- Admin can store a note when rejecting a commercial tag description request.
-- MariaDB 10.1.

ALTER TABLE `ultary_tag_profile_request`
  ADD COLUMN `reject_message` VARCHAR(500) NULL DEFAULT NULL COMMENT 'admin note when rejected' AFTER `status`;
