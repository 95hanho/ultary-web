-- schema v15 → v16
-- 알림 종류별 수신 설정. 행이 없으면 전부 켜짐.
-- MariaDB 10.1. 테이블이 없을 때 1회 실행.

CREATE TABLE IF NOT EXISTS `ultary_notification_setting` (
  `user_no` INT(11) NOT NULL COMMENT '설정 주인. 행이 없으면 알림 전부 켜짐',
  `neighbor` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '이웃 신청',
  `like_post` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '게시글 좋아요',
  `like_comment` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '댓글 좋아요',
  `like_reply` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '답글 좋아요',
  `comment_on_post` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '내 게시글 댓글',
  `reply_on_comment` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '내 댓글 답글',
  `mention` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '댓글·답글 언급',
  `tag_post` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '게시글 태그',
  `tag_story` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '스토리 태그',
  `story_react` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '스토리 공감',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='알림 종류별 수신 여부. 1=켜짐';

ALTER TABLE `ultary_notification_setting`
  ADD CONSTRAINT `FK_notification_setting_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;
