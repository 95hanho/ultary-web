-- schema_version: 46
-- 닉네임태그 변경 시 직전 닉네임 보관. 변경 후 7일간 타인 선점 불가·구 URL → 현재 닉네임 리다이렉트.

ALTER TABLE `ultary_user`
  ADD COLUMN `previous_nickname` VARCHAR(30) NULL DEFAULT NULL
    COMMENT '직전 닉네임태그. 변경 시 이전 값 저장. nickname_changed_at 기준 7일간 중복·리다이렉트에만 사용'
    AFTER `nickname_changed_at`;

CREATE INDEX `IDX_ultary_user_previous_nickname`
  ON `ultary_user` (`previous_nickname`);
