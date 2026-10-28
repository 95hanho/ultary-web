-- 콘텐츠의 주인공 펫. 사진 속 언급/협업 태그와 별도 관계.
CREATE TABLE IF NOT EXISTS ultary_content_pet (
  content_type VARCHAR(5) NOT NULL,
  content_id INT(11) NOT NULL,
  pet_id INT(11) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (content_type, content_id, pet_id),
  KEY idx_content_pet_pet (pet_id, content_type, content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
