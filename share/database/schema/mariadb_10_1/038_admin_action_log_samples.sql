-- 시연용 과거 보충 이력을 실시간 처리 이력과 구분하고 재실행 중복을 방지한다.
ALTER TABLE ultary_admin_action_log
  ADD COLUMN is_sample TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN sample_source_key VARCHAR(100) NULL,
  ADD UNIQUE KEY uk_admin_action_sample_source (sample_source_key);
