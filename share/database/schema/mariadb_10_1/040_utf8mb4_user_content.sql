-- schema v41 → v42
-- 사용자·AI 텍스트가 이모지(4바이트)를 저장할 수 있도록 utf8mb4로 전환한다.
-- 전체 DB 일괄 변환이 아니라, 본문·소개·로그 등 이모지가 들어갈 수 있는 테이블만 대상이다.
--
-- MariaDB 10.1 InnoDB 인덱스 한도 767바이트:
--   utf8mb4에서 UNIQUE/INDEX VARCHAR는 최대 191자(191*4=764).
--   예) ultary_admin.login_id VARCHAR(200) UNIQUE 는 변환하면 실패하므로 제외.
--   아래 대상 테이블의 문자열 UNIQUE는 모두 ≤80자라 그대로 CONVERT 가능하다.
--
-- 적용 전(기존 DB): 백업 후 아래 ALTER를 순서대로 실행. 테이블 재작성·메타데이터 잠금이 걸릴 수 있다.
-- 프로덕션에는 배포 창에서만 적용한다. 이 스크립트만으로 운영 DB를 자동 변경하지 않는다.

ALTER TABLE `ultary_ai_request_log`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_ai_moderation_state`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_ai_moderation_job`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_feed`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_feed_comment`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_feed_reply`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_dm_message`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_user`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_pet`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_story`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_story_text`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_tag`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_tag_profile_request`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE `ultary_notification`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
