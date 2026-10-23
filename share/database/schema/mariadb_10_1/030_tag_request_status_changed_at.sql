-- schema v35 -> v36. 대기 전환을 포함한 실제 상태 변경 시각.
ALTER TABLE ultary_tag_profile_request
  ADD COLUMN status_changed_at DATETIME NULL DEFAULT NULL AFTER reviewed_at;
UPDATE ultary_tag_profile_request SET status_changed_at = reviewed_at WHERE reviewed_at IS NOT NULL;

-- 최신 요청이 거절된 기존 태그도 설명 없는 일반 태그로 되돌린다.
UPDATE ultary_tag t
JOIN ultary_tag_profile_request r ON r.tag_id = t.tag_id
LEFT JOIN ultary_tag_profile_request newer ON newer.tag_id = r.tag_id
  AND newer.tag_profile_request_id > r.tag_profile_request_id
SET t.purpose = 'USER', t.profile_status = 'NONE'
WHERE t.is_deleted = 0 AND r.status = 'REJECTED' AND newer.tag_profile_request_id IS NULL;
