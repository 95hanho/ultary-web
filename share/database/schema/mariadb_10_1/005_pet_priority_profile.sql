-- schema v10 → v11
-- 유저 프로필 사진 컬럼을 없애고, 펫 priority로 대표 사진을 고른다.
-- priority: 작을수록 우선. 1이 가장 높음.
-- 표시용 프로필 사진 = 탈퇴 전 활성 펫 중 profile_file_id가 있는 것 가운데 priority가 가장 높은 펫.
-- 같은 priority면 pet_id가 작은 쪽.
-- MariaDB 10.1

ALTER TABLE `ultary_pet`
  ADD COLUMN `priority` INT(11) NOT NULL DEFAULT 1
    COMMENT '작을수록 우선. 1이 가장 높음. 같은 보호자 펫 목록 순서. 사진 있는 펫 중 가장 높은 우선순위가 그 유저의 프로필 사진'
    AFTER `profile_file_id`;

UPDATE `ultary_pet` p
INNER JOIN (
  SELECT a.pet_id, COUNT(b.pet_id) AS pri
  FROM `ultary_pet` a
  INNER JOIN `ultary_pet` b
    ON b.user_no = a.user_no
   AND b.pet_id <= a.pet_id
  GROUP BY a.pet_id
) ranks ON ranks.pet_id = p.pet_id
SET p.priority = ranks.pri;

ALTER TABLE `ultary_pet`
  ADD KEY `IDX_ultary_pet_user_priority` (`user_no`, `priority`, `pet_id`);

ALTER TABLE `ultary_pet` ALTER `priority` DROP DEFAULT;

ALTER TABLE `ultary_user` DROP FOREIGN KEY `FK_user_profile_file`;
ALTER TABLE `ultary_user` DROP INDEX `IDX_ultary_user_profile_file_id`;
ALTER TABLE `ultary_user` DROP COLUMN `profile_file_id`;
