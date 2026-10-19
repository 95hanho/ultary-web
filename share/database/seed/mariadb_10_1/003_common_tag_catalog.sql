-- ============================================================
-- 공통 태그 카탈로그 (재실행 가능)
-- user 100 = 공통 데이터 소유 계정 (관리용 일반 회원, 관리자 JWT 아님)
-- 일반 USER 해시태그만. 상업 태그(royalcanin·상품 등)는 건드리지 않음
-- HTTP: phone 01010000100 / password Test1234!
-- ============================================================

SET NAMES utf8mb4;

-- 기존 공통 카탈로그 태그 정리 후 다시 넣음
DELETE FROM `ultary_feed_tag`
WHERE `tag_id` BETWEEN 201 AND 299;

DELETE FROM `ultary_tag_image`
WHERE `tag_id` BETWEEN 201 AND 299;

DELETE FROM `ultary_tag`
WHERE `tag_id` BETWEEN 201 AND 299
   OR `created_by_user_no` = 100;

DELETE FROM `ultary_token` WHERE `user_no` = 100;
DELETE FROM `ultary_user_privacy` WHERE `user_no` = 100;
DELETE FROM `ultary_user`
WHERE `user_no` = 100
   OR `email` = 'seed.common@example.com'
   OR `phone` = '01010000100';

-- ---------- 공통 데이터 계정 ----------
INSERT INTO `ultary_user` (
  `user_no`, `password`, `name`, `nickname`, `nickname_changed_at`,
  `is_default_nickname`, `email`, `phone`, `bio`,
  `region_sido`, `region_sigungu`, `withdrawal_status`
) VALUES
(100, '{noop}Test1234!', '울타리', '울타리가든', NOW(), 0,
 'seed.common@example.com', '01010000100',
 '공통 해시태그·검색 키워드를 관리하는 계정',
 '서울특별시', '마포구', 'ACTIVE');

-- 기존 시드 중 공통으로 쓸 USER 태그 소유를 100으로
UPDATE `ultary_tag`
SET `created_by_user_no` = 100
WHERE `tag_id` IN (101, 114, 115, 116, 117)
  AND `purpose` = 'USER';

-- ---------- 공통 해시태그 (USER, profile NONE) ----------
-- tag_id 201~ : 종·품종·행위·병원·생활 키워드
INSERT INTO `ultary_tag` (
  `tag_id`, `hashtag`, `purpose`, `profile_status`,
  `title`, `handle`, `handle_changed_at`, `content`, `link`,
  `use_count`, `created_by_user_no`
) VALUES
-- 대표 종·호칭
(201, '강아지', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(202, '고양이', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(203, '반려동물', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(204, '반려견', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(205, '반려묘', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(206, '댕댕이', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(207, '냥이', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(208, '집사', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(209, '초보집사', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(210, '펫스타그램', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(211, '강아지스타그램', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(212, '고양이스타그램', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(213, '멍스타그램', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(214, '반려생활', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
-- 강아지 품종
(220, '말티즈', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(221, '푸들', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(222, '포메라니안', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(223, '치와와', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(224, '시바견', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(225, '비숑', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(226, '골든리트리버', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(227, '래브라도', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(228, '웰시코기', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(229, '시츄', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(230, '요크셔테리어', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(231, '진돗개', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(232, '보더콜리', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(233, '사모예드', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(234, '허스키', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(235, '불독', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(236, '닥스훈트', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(237, '스피츠', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(238, '믹스견', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
-- 고양이 품종
(240, '코리안숏헤어', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(241, '페르시안', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(242, '러시안블루', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(243, '스코티시폴드', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(244, '먼치킨', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(245, '렉돌', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(246, '브리티시숏헤어', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(247, '아비시니안', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(248, '샴고양이', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(249, '노르웨이숲', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(250, '믹스묘', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
-- 행위·케어
(260, '훈련', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(261, '목욕', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(262, '털갈이', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(263, '그루밍', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(264, '놀이', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(265, '사회화훈련', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(266, '배변훈련', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(267, '하네스산책', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(268, '주말산책', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(269, '한강산책', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(270, '산책매너', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(271, '드라이', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(272, '발톱깎기', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(273, '귀청소', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(274, '양치질', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(275, '분리불안', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(276, '애견카페', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(277, '펫카페', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(278, '애견동반', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
-- 동물병원·건강
(280, '동물병원', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(281, '예방접종', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(282, '중성화', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(283, '건강검진', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(284, '슬개골탈구', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(285, '피부병', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(286, '심장사상충', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(287, '구충', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(288, '접종', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(289, '수술후관리', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(290, '치과스케일링', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(291, '알러지', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(292, '다이어트', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(293, '처방식', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(294, '병원동행', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
-- 생활·용품·입양
(295, '펫용품', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(296, '강아지옷', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(297, '캣타워', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(298, '스크래쳐', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(299, '사료추천', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100);

INSERT INTO `ultary_tag` (
  `tag_id`, `hashtag`, `purpose`, `profile_status`,
  `title`, `handle`, `handle_changed_at`, `content`, `link`,
  `use_count`, `created_by_user_no`
) VALUES
(301, '수제간식', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(302, '입양', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(303, '유기견', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(304, '유기묘', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(305, '구조', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(306, '임시보호', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(307, '강아지간식', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(308, '고양이간식', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(309, '산책코스', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(310, '반려견훈련', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(311, '강아지목욕', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(312, '고양이목욕', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(313, '털관리', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(314, '브러싱', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(315, '강아지용품', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(316, '고양이용품', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(317, '펫보험', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(318, '마이크로칩', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(319, '광견병접종', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100),
(320, '종합백신', 'USER', 'NONE', NULL, NULL, NULL, NULL, NULL, 0, 100);

ALTER TABLE `ultary_tag` AUTO_INCREMENT = 400;
