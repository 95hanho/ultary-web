-- schema_version: 45
-- 관리자 비밀번호 초기화 후 다음 로그인에서 비밀번호 변경 강제.

ALTER TABLE `ultary_user`
  ADD COLUMN `must_change_password` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1=관리자 초기화 후 비밀번호 변경 필요. 회원 비밀번호 변경 성공 시 0'
    AFTER `password_changed_at`;
