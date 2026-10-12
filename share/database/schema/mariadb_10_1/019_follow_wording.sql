-- schema_version: 25
-- 주민·이웃 용어를 팔로우·팔로워로. 컬럼·ENUM 값은 그대로이고 설명만 바꾼다.
-- 목록 API type 은 FOLLOW(내가 팔로우) | FOLLOWER(나를 팔로우). 카운트는 followCount, followerCount.

ALTER TABLE `ultary_neighbor`
  MODIFY COLUMN `requester_user_no` INT(11) NOT NULL COMMENT '팔로우 요청을 보낸 사용자',
  MODIFY COLUMN `receiver_user_no` INT(11) NOT NULL COMMENT '팔로우 요청을 받은 사용자',
  COMMENT = '팔로우 관계. 요청자가 수신자를 팔로우. followed_back이면 맞팔';

ALTER TABLE `ultary_feed`
  MODIFY COLUMN `visibility` ENUM('PUBLIC','NEIGHBORS','PRIVATE') NOT NULL DEFAULT 'PUBLIC' COMMENT 'PUBLIC: 전체 공개, NEIGHBORS: 팔로우 관계 공개, PRIVATE: 나만 보기';

ALTER TABLE `ultary_notification`
  COMMENT = '팔로우 신청, 좋아요, 댓글·답글, 언급, 태그, 스토리 공감. 같은 대상은 1행으로 집계';

ALTER TABLE `ultary_notification_setting`
  MODIFY COLUMN `neighbor` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '팔로우 신청';

ALTER TABLE `ultary_user_privacy`
  MODIFY COLUMN `private_account` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1이면 전체 공개 게시글·스토리는 조회자가 그 계정을 팔로우할 때만',
  MODIFY COLUMN `neighbor_request` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '팔로우 신청 받기';
