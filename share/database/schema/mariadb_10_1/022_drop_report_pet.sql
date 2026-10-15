-- schema v27 -> v28
-- Reports are USER, FEED, COMMENT, REPLY only.
-- MariaDB 10.1. Run each statement on its own if the client allows only one.

DELETE FROM `ultary_report` WHERE `target_type` = 'PET';

ALTER TABLE `ultary_report` DROP FOREIGN KEY `FK_report_target_pet`;

ALTER TABLE `ultary_report` DROP COLUMN `target_pet_id`;

ALTER TABLE `ultary_report`
  MODIFY COLUMN `target_type` ENUM('USER','FEED','COMMENT','REPLY') NOT NULL;
