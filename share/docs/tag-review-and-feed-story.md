# 태그 요청 상태와 피드 작성자 스토리

## 관리자 태그 요청

- 승인·거절된 요청은 오른쪽 상태 선택창의 대기 옵션으로 되돌린다. 별도 대기 전환 버튼은 두지 않는다. 상세 화면은 `requestId`를 전달해 선택한 요청을 처리한다.
- `POST /api/v1/admin/tags/{tagId}/approve`, `/pending`: 선택적 `requestId` 요청 파라미터. 생략 시 기존처럼 최신 요청을 처리한다.
- `POST /api/v1/admin/tags/{tagId}/reject`: JSON의 선택적 `requestId`와 `rejectMessage`. 다른 태그의 요청 ID는 404 `TAG_PROFILE_REQUEST_NOT_FOUND`.
- 요청 태그(COMMERCIAL)는 APPROVED일 때 작성용 검색·추천 및 새 게시글 태그 연결이 가능하다. 대기 전환·재요청 시 COMMERCIAL/PENDING으로 신규 연결을 막는다.
- 거절 시 요청 상태와 태그 상태를 REJECTED로 남기고 목적은 USER로 전환한다. 기존 피드의 태그 연결만 유지하고 작성용 검색·추천·신규 사용은 차단한다. 소개·이미지·링크는 공개하지 않아 설명 팝업도 뜨지 않는다. 최신 계약은 ai-manual-review-and-phone-demo.md를 참고한다.
- 태그 설명의 전역 캐시는 요청 진행 중에만 공유한다. 설명을 다시 열면 새 상태를 조회한다.
- 목록·상태 변경 응답에 `feedCount`, `statusChangedAt`을 제공한다. feedCount는 삭제되지 않은 피드·태그 연결의 수이며 공개 범위와 관계없이 집계한다. 상태 변경 시각은 처음 요청 시 null, 승인·거절·대기 전환 시 기록한다. 기존 reviewedAt은 대기 전환 시 초기화한다.
- 목록은 닉네임(user_no) 옆 요청일, 상태 아래 변경일을 표시한다. 태그 옆 `- N Feeds`는 보통 굵기다. 상세는 태그 피드 수 N개를 표시하며 링크 글자만 클릭 가능하다. 연결 피드 목록은 만들지 않는다.
- DB schema v36: `030_tag_request_status_changed_at.sql`. 변경일 추가·기존 검토일 보정 및 최신 요청이 거절인 태그의 일반 태그 전환.

## 태그 심사 알림

- 상태가 APPROVED/REJECTED로 바뀌면 해당 요청자에게 알림을 저장하고 기존 WebSocket 안 읽음 배지 경로로 전달한다. 대기로 되돌릴 때는 알림을 만들지 않는다.
- 상태 변경 시 같은 요청·수신자의 태그 심사 알림 중 `created_at >= NOW() - INTERVAL 2 MINUTE`인 건만 먼저 삭제한다. 승인·거절이면 새 결과 알림을 생성하고, 대기이면 삭제만 한다. 같은 상태를 다시 호출하면 알림은 그대로 둔다.
- 2분보다 오래된 알림과 다른 요청의 알림은 유지한다. 새 심사 알림은 이벤트별 group_key를 사용해 이전 알림의 생성 시각을 재사용하지 않는다. 기존 고정 group_key 알림도 정리 대상에 포함한다. 추가 DB 변경은 없다.
- 알림 타입: `TAG_PROFILE_APPROVED`, `TAG_PROFILE_REJECTED`. `snippet`은 해시태그 이름이며 `message`는 `#이름 의 태그 요청이 수락되었습니다.` 또는 `#이름 의 태그 요청이 거절되었습니다.`이다.
- FE에서 태그 이름은 `/settings/hashtags` 링크로 꾸미고 거절 문구 중 `거절`만 red-500으로 표시한다.
- DB 마이그레이션: schema v35, `029_tag_review_notifications.sql`. 기존 DB에 enum 확장이 필요하다.

## 피드·댓글·답글 작성자

- FeedResponse, FeedCommentResponse, FeedReplyResponse에 `authorHasStory`, `authorHasUnviewedStory`를 추가했다.
- 기존 스토리 공개 범위·차단·열람 이력을 사용한다. 비로그인 피드는 두 값 모두 false다.
- FE 공통 Profile을 사용해 없음/읽음/안 읽음 링을 표시한다. 사진 크기는 피드 36px, 댓글 40px, 답글 32px을 유지한다.
- 스토리가 있을 때 사진은 `/stories?userNo=...&nickname=...&single=1`로 이동한다. 스토리가 없으면 클릭 동작이 없다. 닉네임의 울타리 링크는 유지한다.

## 검증

- BE 선택 테스트 7개 통과: TagReviewIntegrationTest, FeedAuthorStoryIntegrationTest, TagServiceRecommendTest. DB 테스트는 롤백한다.
- 최근 알림 정리 후 TagReviewIntegrationTest 6개 재검증 통과: 새 결과로 교체·대기 시 제거, 오래된 알림·다른 요청 유지, 기존 group_key 정리 및 동일 상태 재호출 시 알림 유지.
- 관리자 form HTTP API를 통한 거절→대기 전환 회귀 테스트를 추가해 총 7개 통과. 응답 PENDING, DB 요청·태그 PENDING, 최근 알림 제거까지 확인한다.
- 개발 서버에서 대기 API만 핸들러 진입 전 시간 초과될 경우가 관찰됐다. 기존 .next/dev를 보관한 뒤 캐시를 새로 생성하고 Next를 재시작해 복구했다. 인증 없는 진단 응답은 401이며 실제 심사 상태를 변경하지 않는다.
- FE 타입 검사, 기존 인증·울타리 회귀 103개, 태그 재사용·스토리 매핑 회귀 5개 통과.
- 태그·알림·BFF·매핑 변경 파일과 MainClient 린트 통과. 기존 Feed/CommentSheet의 ref·effect 관련 린트 오류는 별도 정리 대상이다.
