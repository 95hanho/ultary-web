-- schema v16 → v17
-- 공개 범위. 행이 없으면 비공개 계정 꺼짐, 게시글 전체, 스토리 이웃, 신청·댓글·멘션·태그 켜짐.
-- MariaDB 10.1. 테이블이 없을 때 1회 실행.

CREATE TABLE IF NOT EXISTS `ultary_user_privacy` (
  `user_no` INT(11) NOT NULL COMMENT '설정 주인. 행이 없으면 아래 기본값',
  `private_account` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1이면 전체 공개 게시글·스토리도 이웃만',
  `feed_visibility` ENUM('PUBLIC','NEIGHBORS','PRIVATE') NOT NULL DEFAULT 'PUBLIC' COMMENT '새 게시글 기본 공개 범위',
  `story_visibility` ENUM('PUBLIC','NEIGHBORS','PRIVATE') NOT NULL DEFAULT 'NEIGHBORS' COMMENT '스토리 공개 범위',
  `neighbor_request` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '이웃 신청 받기',
  `allow_comment` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '게시글 댓글·답글 허용',
  `allow_mention` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '댓글·답글 멘션 허용',
  `allow_tag` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '게시글·스토리 태그 허용',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='공개 범위. 행이 없으면 기본값';

ALTER TABLE `ultary_user_privacy`
  ADD CONSTRAINT `FK_user_privacy_user` FOREIGN KEY (`user_no`) REFERENCES `ultary_user` (`user_no`) ON UPDATE CASCADE ON DELETE CASCADE;
