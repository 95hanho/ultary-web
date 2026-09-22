-- schema_version: 7 → 8
-- ultary_file: copyright/copyright_url → 출처·저작자 컬럼
-- 기존 DB에만 실행. 신규는 001_init_schema.sql(v8)만 실행.

ALTER TABLE `ultary_file`
  DROP COLUMN `copyright`,
  DROP COLUMN `copyright_url`,
  ADD COLUMN `source_type` VARCHAR(20) NULL DEFAULT NULL COMMENT 'OWNED|UNSPLASH|AI|ETC' AFTER `file_path`,
  ADD COLUMN `author_name` VARCHAR(100) NULL DEFAULT NULL COMMENT '사진 작가명·크레딧' AFTER `source_type`,
  ADD COLUMN `source_url` VARCHAR(500) NULL DEFAULT NULL COMMENT '원본 이미지/사진 페이지' AFTER `author_name`,
  ADD COLUMN `license_url` VARCHAR(500) NULL DEFAULT NULL COMMENT '라이선스 페이지' AFTER `source_url`,
  ADD COLUMN `copyright_notice` VARCHAR(255) NULL DEFAULT NULL COMMENT '별도 저작권 문구(있을 때만)' AFTER `license_url`,
  ADD KEY `IDX_ultary_file_source_type` (`source_type`) USING BTREE;
