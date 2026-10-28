-- One-time migration: nickname remains unique; contacts can be shared by accounts.
ALTER TABLE ultary_user DROP INDEX UK_ultary_user_email, DROP INDEX UK_ultary_user_phone,
  ADD KEY IDX_ultary_user_email (email), ADD KEY IDX_ultary_user_phone (phone);

CREATE TABLE IF NOT EXISTS ultary_user_link (
  owner_user_no INT(11) NOT NULL,
  target_user_no INT(11) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (owner_user_no, target_user_no),
  KEY IDX_ultary_link_target (target_user_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
