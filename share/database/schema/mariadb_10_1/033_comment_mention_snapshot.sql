-- Preserve explicitly selected mention identities when AI restores an approved body.
CREATE TABLE IF NOT EXISTS ultary_comment_mention_snapshot (
  target_type VARCHAR(7) NOT NULL,
  target_id INT(11) NOT NULL,
  content_hash CHAR(64) NOT NULL,
  targets_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (target_type, target_id, content_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
