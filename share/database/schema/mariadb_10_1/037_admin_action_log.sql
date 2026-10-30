-- 관리자 조치와 같은 트랜잭션으로 저장하는 처리 이력. 과거 기록은 추정 생성하지 않는다.
CREATE TABLE IF NOT EXISTS ultary_admin_action_log (
  action_log_id BIGINT NOT NULL AUTO_INCREMENT,
  admin_no INT(11) NOT NULL,
  admin_login_id VARCHAR(50) NOT NULL,
  admin_name VARCHAR(50) NULL,
  action VARCHAR(40) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id INT(11) NOT NULL,
  request_id INT(11) NULL,
  target_label VARCHAR(150) NULL,
  before_status VARCHAR(30) NULL,
  after_status VARCHAR(30) NULL,
  reason VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (action_log_id),
  KEY idx_admin_action_created (created_at, action_log_id),
  KEY idx_admin_action_target (target_type, target_id, action_log_id),
  KEY idx_admin_action_admin (admin_no, action_log_id),
  CONSTRAINT fk_admin_action_admin FOREIGN KEY (admin_no) REFERENCES ultary_admin(admin_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
