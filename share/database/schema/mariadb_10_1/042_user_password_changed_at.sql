-- schema_version: 44
-- 관리자 회원 「주요 타임라인」용. 비밀번호 변경 시각(회원가입 설정은 넣지 않음).
-- 기존 행은 NULL 유지(과거 변경은 타임라인에 안 뜸). AuthService 변경·관리자 초기화부터 기록.

ALTER TABLE `ultary_user`
  ADD COLUMN `password_changed_at` DATETIME NULL DEFAULT NULL
    COMMENT '비밀번호 마지막 변경/초기화 시각. 가입 시 NULL. 변경·관리자 초기화 시 NOW()'
    AFTER `password`;
