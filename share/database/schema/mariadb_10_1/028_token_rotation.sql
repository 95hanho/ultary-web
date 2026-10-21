-- schema v33 -> v34. 재발급 원자성 및 짧은 중복 요청 복구를 위한 교체 이력.
ALTER TABLE `ultary_token`
  ADD COLUMN `replaced_by_token_id` INT(11) NULL DEFAULT NULL AFTER `revoked_at`,
  ADD COLUMN `rotated_at` DATETIME NULL DEFAULT NULL AFTER `replaced_by_token_id`;
