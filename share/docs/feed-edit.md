# 게시글 수정

- 내 피드 메뉴는 게시글 수정·삭제를 표시한다. 울타리 고정·게시글 저장은 다른 사람의 피드에서 표시한다.
- 수정 경로: `/myultary/{nickname}/write/compose?editFeedId={feedId}`. 작성 화면을 재사용하며 제목은 `게시글 수정`, 완료 버튼은 `수정`이다.
- 원본 사진·영상·순서·공개 범위는 화면에서 변경하지 않는다. 사진 태그와 본문만 수정한다. 수정 시 파일을 재업로드하지 않는다.
- `GET /api/v1/feeds/{feedId}`로 원본을 불러오고 작성자 확인 후 임시 초안을 만든다. 사진 태그 화면을 다녀와도 수정 ID와 초안을 보존한다. 수정 화면을 새로고침하면 서버의 저장된 내용으로 다시 시작한다.
- 저장 요청: `PATCH /api/v1/feeds/{feedId}`. BFF 경로는 `/api/feeds/{feedId}`. 기존 content/clearContent/visibility는 호환 유지한다.

```json
{
  "content": "초코와 산책 #산책",
  "clearContent": false,
  "tagIds": [101],
  "mediaTags": [
    {"feedMediaId": 501, "mentions": [{"petId": 101, "posX": 25.5, "posY": 70}]},
    {"feedMediaId": 502, "mentions": []}
  ]
}
```

- `mediaTags`: 생략/null은 기존 사진 태그 유지. 최대 10개. 각 항목은 **해당 게시글의 기존** feedMediaId와 교체할 mentions(필수, 최대 20개)다. mentions=[]는 해당 사진 태그 삭제, mediaTags=[]는 변경 없음이다. 같은 사진 ID를 중복 전달하거나 다른 게시글 사진 ID를 전달하면 400 INVALID_INPUT.
- 멘션 petId는 필수, 좌표는 0..100 범위다. 활성 펫과 태그 허용 설정을 확인한다. 원본 파일 ID·미디어 타입·정렬 순서를 수정하는 필드는 없다.
- 본문을 전달하면 BE가 승인 후 해시태그를 추출해 연결을 교체한다. 새 태그와 피드는 같은 트랜잭션에 저장한다. `tagIds`는 호환용으로 유지하며 본문과 함께 전달하면 합집합을 사용한다. 본문·tagIds 모두 생략하면 기존 연결 유지, tagIds만 []로 전달하면 연결 삭제. 상세: [feed-caption-tags.md](feed-caption-tags.md).
- 사진 태그에서 빠진 TAGGED 펫 연결은 해제하고 새 펫을 연결한다. 기존 COLLABORATOR 권한은 유지한다. 태그가 실제 변경된 경우 태그 알림을 갱신한다.
- 수정 권한은 작성자 및 예약된 100번 계정 정책을 따른다. 본문·사진 태그·본문 태그 변경은 하나의 트랜잭션이다. 본문과 태그는 저장 전 동기 AI 검사를 통과해야 하며 거절·장애 시 기존 내용과 연결을 유지한다.
- 읽기 응답 media[].mentions[]는 기존 petId/posX/posY 외 mentionId/petName/userNo(보호자)/ownerNickname을 제공해 기존 사진 태그 이름을 표시한다.
- 저장 중 전체 화면 로딩, 실패 시 이유 모달과 초안 유지. 수정 성공 시 진입 페이지(URL 쿼리·해시 포함)와 게시글의 화면상 위치로 돌아간다. 사진 태그 화면을 다녀와도 최초 진입 위치를 유지한다. 복귀 정보 없이 수정 URL로 직접 진입하면 게시글 상세로 이동한다. DB 스키마 변경은 없다.
