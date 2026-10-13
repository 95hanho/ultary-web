-- schema v25 -> v26
-- ultary_tag.purpose, profile_status.
-- Tags with title, content, or link become COMMERCIAL and stay visible (APPROVED).
-- New commercial descriptions stay hidden until an admin approves the request.
-- MariaDB 10.1. Run each statement on its own if the client allows only one.

ALTER TABLE `ultary_tag`
  ADD COLUMN `purpose` ENUM('USER','COMMERCIAL') NOT NULL DEFAULT 'USER' COMMENT 'USER casual hashtag, COMMERCIAL product tag' AFTER `hashtag`,
  ADD COLUMN `profile_status` ENUM('NONE','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'NONE' COMMENT 'APPROVED shows title, content, link, images' AFTER `purpose`;

UPDATE `ultary_tag`
SET `purpose` = 'COMMERCIAL',
    `profile_status` = 'APPROVED'
WHERE (`title` IS NOT NULL AND `title` <> '')
   OR (`content` IS NOT NULL AND `content` <> '')
   OR (`link` IS NOT NULL AND `link` <> '');

CREATE TABLE `ultary_tag_profile_request` (
  `tag_profile_request_id` INT(11) NOT NULL AUTO_INCREMENT,
  `tag_id` INT(11) NOT NULL,
  `requester_user_no` INT(11) NOT NULL COMMENT 'user who asked to put this text on the tag',
  `title` VARCHAR(100) NULL DEFAULT NULL,
  `content` VARCHAR(500) NULL DEFAULT NULL,
  `link` VARCHAR(200) NULL DEFAULT NULL,
  `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `reviewed_by_admin_id` INT(11) NULL DEFAULT NULL,
  `reviewed_at` DATETIME NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tag_profile_request_id`) USING BTREE,
  KEY `IDX_ultary_tag_profile_request_tag_status` (`tag_id`, `status`) USING BTREE,
  KEY `IDX_ultary_tag_profile_request_requester` (`requester_user_no`, `status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='commercial tag description request';

CREATE TABLE `ultary_tag_profile_request_image` (
  `tag_profile_request_image_id` INT(11) NOT NULL AUTO_INCREMENT,
  `tag_profile_request_id` INT(11) NOT NULL,
  `file_id` INT(11) NOT NULL,
  `sort_order` INT(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`tag_profile_request_image_id`) USING BTREE,
  UNIQUE KEY `UK_ultary_tag_profile_request_image_sort` (`tag_profile_request_id`, `sort_order`) USING BTREE,
  KEY `IDX_ultary_tag_profile_request_image_file` (`file_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='images attached to a commercial tag request';

ALTER TABLE `ultary_tag_profile_request`
  ADD CONSTRAINT `FK_tag_profile_request_tag` FOREIGN KEY (`tag_id`) REFERENCES `ultary_tag` (`tag_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_tag_profile_request_user` FOREIGN KEY (`requester_user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT `FK_tag_profile_request_admin` FOREIGN KEY (`reviewed_by_admin_id`) REFERENCES `ultary_admin` (`admin_no`) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE `ultary_tag_profile_request_image`
  ADD CONSTRAINT `FK_tag_profile_request_image_request` FOREIGN KEY (`tag_profile_request_id`) REFERENCES `ultary_tag_profile_request` (`tag_profile_request_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  ADD CONSTRAINT `FK_tag_profile_request_image_file` FOREIGN KEY (`file_id`) REFERENCES `ultary_file` (`file_id`) ON UPDATE CASCADE ON DELETE RESTRICT;
