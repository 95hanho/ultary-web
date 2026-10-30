-- 037/038 적용 후, 사용자 요청에 따라 기존 처리일 기반의 시연 이력을 보충한다.
-- 원본 태그·신고·AI 처리 상태/날짜는 변경하지 않는다.
-- 변경 전 상태와 설명, 원본에 없는 처리자 배정은 시연용이며 모든 행을 is_sample=1로 표시한다.
-- source_key로 재실행 중복을 막고, 이미 실제 이력이 있는 동일 대상/조치는 건너뛴다.
INSERT INTO ultary_admin_action_log (
  admin_no,admin_login_id,admin_name,action,target_type,target_id,request_id,target_label,
  before_status,after_status,reason,is_sample,sample_source_key,created_at
)
SELECT COALESCE(known.admin_no,fallback.admin_no),COALESCE(known.login_id,fallback.login_id),
  COALESCE(known.name,fallback.name),s.action,s.kind,s.target_id,s.request_id,s.label,
  s.before_status,s.after_status,s.reason,1,s.source_key,s.processed_at
FROM (
  SELECT r.reviewed_by_admin_id AS source_admin,
    CASE r.status WHEN 'APPROVED' THEN 'TAG_APPROVED' WHEN 'REJECTED' THEN 'TAG_REJECTED' ELSE 'TAG_PENDING' END AS action,
    'TAG' AS kind,r.tag_id AS target_id,r.tag_profile_request_id AS request_id,CONCAT('#',t.hashtag) AS label,
    CASE r.status WHEN 'PENDING' THEN 'APPROVED' ELSE 'PENDING' END AS before_status,r.status AS after_status,
    CASE r.status
      WHEN 'APPROVED' THEN '태그 설명과 상품 정보·링크를 검토하여 승인했습니다.'
      WHEN 'REJECTED' THEN CONCAT('태그 요청을 검토하여 거절했습니다. 사유: ',COALESCE(NULLIF(r.reject_message,''),'설명 또는 링크 보완 필요'))
      ELSE '추가 확인이 필요하여 태그 요청을 대기 상태로 변경했습니다.' END AS reason,
    CONCAT('legacy-tag-request:',r.tag_profile_request_id) AS source_key,
    COALESCE(r.status_changed_at,r.reviewed_at) AS processed_at
  FROM ultary_tag_profile_request r JOIN ultary_tag t ON t.tag_id=r.tag_id
  WHERE COALESCE(r.status_changed_at,r.reviewed_at) IS NOT NULL
    AND r.status IN ('APPROVED','REJECTED','PENDING')
  UNION ALL
  SELECT r.admin_no,
    CASE r.status WHEN 'CONFIRMED' THEN 'REPORT_CONFIRMED' WHEN 'REJECTED' THEN 'REPORT_REJECTED'
      WHEN 'DELETED' THEN 'REPORT_DELETED' ELSE 'REPORT_SUSPENDED' END,
    'REPORT',r.report_id,NULL,CONCAT('신고 #',r.report_id),'REQUESTED',r.status,
    CASE r.status
      WHEN 'CONFIRMED' THEN '신고 대상과 내용을 검토하여 확인 상태로 분류했습니다.'
      WHEN 'REJECTED' THEN '신고 내용을 검토한 결과 제재 대상에 해당하지 않아 거절했습니다.'
      WHEN 'DELETED' THEN '신고 대상의 부적절한 내용을 확인하여 삭제 조치했습니다.'
      ELSE '신고 내용을 검토하여 해당 회원을 정지했습니다.' END,
    CONCAT('legacy-report:',r.report_id),r.processed_at
  FROM ultary_report r
  WHERE r.processed_at IS NOT NULL AND r.status IN ('CONFIRMED','REJECTED','DELETED','SUSPENDED')
  UNION ALL
  SELECT j.admin_reviewed_by,'AI_REVIEW','AI_REVIEW',l.ai_request_id,NULL,
    CONCAT(CASE j.target_type WHEN 'FEED' THEN '게시글' WHEN 'COMMENT' THEN '댓글' ELSE '답글' END,' #',j.target_id),
    'PENDING',j.admin_review_status,
    CASE j.admin_review_status
      WHEN 'DELETED' THEN 'AI 검사 오류 건을 수동 검토하여 부적절한 콘텐츠를 숨김 처리했습니다.'
      WHEN 'KEPT' THEN 'AI 검사 오류 건을 수동 검토하여 콘텐츠를 유지했습니다.'
      ELSE '추가 검토가 필요하여 AI 오류 조치를 확인 대기 상태로 변경했습니다.' END,
    CONCAT('legacy-ai-job:',j.job_id),j.admin_reviewed_at
  FROM ultary_ai_moderation_job j
  JOIN ultary_ai_request_log l ON l.ai_request_id=(SELECT MAX(a.ai_request_id) FROM ultary_ai_request_log a WHERE a.moderation_job_id=j.job_id AND a.status='FAILED')
  WHERE j.admin_reviewed_at IS NOT NULL AND j.admin_review_status IN ('PENDING','KEPT','DELETED')
) s
LEFT JOIN ultary_admin known ON known.admin_no=s.source_admin
JOIN ultary_admin fallback ON fallback.admin_no=(SELECT MIN(admin_no) FROM ultary_admin WHERE status='ACTIVE')
WHERE NOT EXISTS (SELECT 1 FROM ultary_admin_action_log old WHERE old.sample_source_key=s.source_key)
  AND NOT EXISTS (SELECT 1 FROM ultary_admin_action_log live
    WHERE live.is_sample=0 AND live.target_type=s.kind AND live.target_id=s.target_id AND live.action=s.action
      AND (s.kind!='TAG' OR live.request_id=s.request_id OR live.request_id IS NULL))
ORDER BY s.processed_at,s.source_key;
