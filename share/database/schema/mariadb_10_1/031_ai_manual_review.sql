-- schema v36 -> v37
ALTER TABLE ultary_ai_moderation_job
 ADD COLUMN admin_review_status VARCHAR(10) NOT NULL DEFAULT 'PENDING',
 ADD COLUMN admin_reviewed_at DATETIME NULL,
 ADD COLUMN admin_reviewed_by INT(11) NULL;
UPDATE ultary_tag t JOIN ultary_tag_profile_request r ON r.tag_id=t.tag_id
LEFT JOIN ultary_tag_profile_request n ON n.tag_id=r.tag_id AND n.tag_profile_request_id>r.tag_profile_request_id
SET t.profile_status='REJECTED'
WHERE t.is_deleted=0 AND r.status='REJECTED' AND n.tag_profile_request_id IS NULL;
