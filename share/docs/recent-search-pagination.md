# 최근 검색 더보기

- GET /api/v1/main/search/recent: 최근 검색 항목 5개.
- GET /api/v1/main/search/recent/more?cursorHistoryId=...: 직전 응답의 nextCursorHistoryId를 전달해 다음 20개.
- 두 응답은 items, nextCursorHistoryId, totalCount를 포함한다. totalCount는 차단·탈퇴 계정, 삭제 태그 등 목록과 같은 표시 조건을 적용한 전체 개수다. 커서 이후 개수가 아니다.
- 검색 페이지는 항목을 기존 목록에 이어 붙이고, 오른쪽 아래 더보기 텍스트 버튼을 표시한다. 다음 커서가 없거나 표시 개수가 totalCount에 도달하면 버튼을 숨긴다. 로딩 중 중복 클릭을 막고, 실패 시 기존 항목을 유지하며 다시 시도할 수 있다.
- 개별 삭제 시 개수를 갱신하고, 마지막 커서 항목을 삭제하면 앞의 남은 항목을 커서로 사용한다. 모두 지우기와 이전 요청 응답이 충돌하지 않도록 요청을 무효화한다.

DB 스키마 변경은 없다.

태그 항목은 feedCount(현재 조회자에게 보이는 게시글 수)를 포함한다. 화면은 기존 태그 검색과 같은 formatTagPostCount 형식의 N POST를 삭제 X 왼쪽에 표시한다. 0건은 0 POST이며 계정 항목에는 표시하지 않는다. 첫 조회와 더보기 모두 같은 수를 계산한다.
