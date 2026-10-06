/**
 * 엔드포인트 경로 모음.
 *
 * - bffEndpoints   : 브라우저 → Next Route Handler
 * - springEndpoints: Next 서버 → Spring
 *
 * JSDoc의 Method는 BFF/Spring 공통 의도. 구현 시 맞춰 사용.
 */

/** 브라우저 → Next BFF */
export const bffEndpoints = {
  health: {
    /** GET */
    check: '/api/health',
  },

  auth: {
    /** POST 로그인 (email|phone + password) */
    login: '/api/auth/login',
    /** POST 토큰 재발급 */
    refresh: '/api/auth/refresh',
    /** POST 로그아웃 */
    logout: '/api/auth/logout',
    /** GET 내 회원정보 */
    me: '/api/auth/me',
    /** PATCH 회원정보 변경 (닉네임 제외) */
    updateMe: '/api/auth/me',
    /** PATCH 닉네임 변경 */
    changeNickname: '/api/auth/me/nickname',
    /** DELETE 회원탈퇴 */
    withdraw: '/api/auth/me',
    /** POST 회원가입 */
    signup: '/api/auth/signup',
    /** POST 휴대폰 인증 요청 */
    phone: '/api/auth/phone',
    /** POST 휴대폰 인증 확인 */
    phoneVerify: '/api/auth/phone/verify',
    /** POST 비밀번호 변경 토큰 생성 */
    passwordToken: '/api/auth/password/token',
    /** PUT 비밀번호 변경 (비로그인 · passwordChangeToken) */
    password: '/api/auth/password',
    /** PUT 로그인 중 비밀번호 변경/최초 설정 */
    passwordMe: '/api/auth/password/me',
    /** GET 구글 소셜 로그인 시작 (BFF OAuth) */
    google: '/api/auth/social/google',
    /** GET 구글 콜백 (BFF OAuth → Spring social/login) */
    googleCallback: '/api/auth/social/google/callback',
    /** GET 카카오 소셜 로그인 시작 (BFF OAuth) */
    kakao: '/api/auth/social/kakao',
    /** GET 카카오 콜백 (BFF OAuth → Spring social/login) */
    kakaoCallback: '/api/auth/social/kakao/callback',
    /** POST 소셜 계정 연동 */
    socialLink: '/api/auth/social/link',
    /** DELETE 소셜 계정 연동 해제 ?provider= */
    socialUnlink: '/api/auth/social/unlink',
  },

  main: {
    /** GET 주민 스토리 보유 목록 */
    storyOwners: '/api/main/stories/owners',
    /** GET 주민 스토리 조회 ?userNo= */
    stories: '/api/main/stories',
    /** GET 주민 게시글 무한스크롤 */
    feeds: '/api/main/feeds',
    /** GET 메인 추천 게시글 ?limit= */
    feedsRecommended: '/api/main/feeds/recommended',
    /** GET 검색 ?q=&type= */
    search: '/api/main/search',
    /** GET 검색 추천 게시글 ?limit= */
    searchRecommended: '/api/main/search/recommended',
    /** GET 최근 검색 5건 / POST 울타리 진입 저장 */
    searchRecent: '/api/main/search/recent',
    /** GET 최근 검색 더보기 ?cursorHistoryId= */
    searchRecentMore: '/api/main/search/recent/more',
  },

  myUltary: {
    /** GET 마이울타리 정보 */
    profile: '/api/my-ultary',
    /** GET MY 게시글 그리드 */
    feeds: '/api/my-ultary/feeds',
    /** GET MY 게시글 상세(피드형) */
    feedDetail: '/api/my-ultary/feeds/:feedId',
    /** GET 저장한 게시글 */
    savedFeeds: '/api/my-ultary/saved-feeds',
    /** GET 태그된 게시글 */
    taggedFeeds: '/api/my-ultary/tagged-feeds',
    /** PATCH 소개글 */
    bio: '/api/my-ultary/bio',
    /** GET 내 스토리 목록 / POST 스토리 등록 */
    stories: '/api/my-ultary/stories',
    /** DELETE 스토리 삭제 */
    story: '/api/my-ultary/stories/:storyId',
  },

  stories: {
    /** POST 스토리 읽음 (ultary_story_view · 본인 스토리는 미기록) */
    view: '/api/stories/:storyId/view',
    /** POST 공감 / DELETE 공감 취소 */
    like: '/api/stories/:storyId/like',
  },

  pets: {
    /** GET 목록 / POST 등록 */
    root: '/api/pets',
    /** PATCH 수정 (profileFileId·priority 포함) / DELETE 삭제 */
    detail: '/api/pets/:petId',
    /** PATCH 멘션 ID 변경 */
    mentionId: '/api/pets/:petId/mention-id',
    /** POST 피드 반려동물 태그 승인 */
    tagApprove: '/api/pets/tags/:feedPetId/approve',
    /** POST 피드 반려동물 태그 거절 */
    tagReject: '/api/pets/tags/:feedPetId/reject',
  },

  feeds: {
    /** POST 게시글 등록 */
    root: '/api/feeds',
    /** GET 상세 / PATCH 수정 / DELETE 삭제 */
    detail: '/api/feeds/:feedId',
    /** POST 좋아요 / DELETE 좋아요 취소 */
    like: '/api/feeds/:feedId/like',
    /** GET 좋아요한 사람 목록 */
    likers: '/api/feeds/:feedId/likers',
    /** POST 저장 / DELETE 저장 해제 */
    store: '/api/feeds/:feedId/store',
    /** POST 공유 (DM 전송 등) */
    share: '/api/feeds/:feedId/share',
    /** GET 댓글 목록 / POST 댓글 작성 */
    comments: '/api/feeds/:feedId/comments',
    /** PATCH 댓글 수정 / DELETE 댓글 삭제 */
    comment: '/api/feeds/:feedId/comments/:commentId',
    /** POST 댓글 좋아요 / DELETE 취소 */
    commentLike: '/api/feeds/:feedId/comments/:commentId/like',
    /** GET 답글 목록 / POST 답글 작성 */
    replies: '/api/feeds/:feedId/comments/:commentId/replies',
    /** PATCH 답글 수정 / DELETE 답글 삭제 */
    reply: '/api/feeds/:feedId/comments/:commentId/replies/:replyId',
    /** POST 답글 좋아요 / DELETE 취소 */
    replyLike: '/api/feeds/:feedId/comments/:commentId/replies/:replyId/like',
  },

  tags: {
    /** GET 태그 정보 */
    detail: '/api/tags/:tagId',
    /** GET 태그 검색 ?q= */
    search: '/api/tags/search',
    /** GET 내용 기반 태그 추천 ?q= */
    recommend: '/api/tags/recommend',
    /** POST 태그 등록 */
    root: '/api/tags',
  },

  users: {
    /** GET 다른 유저 울타리 정보 */
    ultary: '/api/users/:userNo/ultary',
    /** GET 그 유저의 펫 목록 */
    pets: '/api/users/:userNo/pets',
    /** GET 그 유저의 게시글 그리드 */
    feeds: '/api/users/:userNo/feeds',
    /** GET 주민/이웃 목록 ?type= */
    neighbors: '/api/users/:userNo/neighbors',
    /** POST 주민 요청 */
    neighborRequest: '/api/users/:userNo/neighbors/request',
    /** POST 주민 요청 수락 */
    neighborAccept: '/api/neighbors/:neighborId/accept',
    /** POST 주민 요청 거절 */
    neighborReject: '/api/neighbors/:neighborId/reject',
    /** DELETE 주민 요청 취소 / 이웃 해제 */
    neighborCancel: '/api/neighbors/:neighborId',
    /** POST 차단 */
    block: '/api/users/:userNo/block',
    /** DELETE 차단 해제 */
    unblock: '/api/users/:userNo/block',
    /** GET 내가 차단한 사용자 */
    blocks: '/api/users/blocks',
    /** POST 신고 */
    report: '/api/reports',
  },

  write: {
    /** POST 작성 사진 목록 임시저장 */
    draftPhotos: '/api/write/draft-photos',
    /** POST 편집된 사진 저장 */
    editedPhoto: '/api/write/edited-photos',
    /** POST 사진 태그 저장 */
    photoTags: '/api/write/photo-tags',
  },

  dm: {
    /** GET 메시지(방) 리스트 / POST 대화방 생성 */
    rooms: '/api/dm/rooms',
    /** DELETE 대화방 나가기 */
    room: '/api/dm/rooms/:roomId',
    /** POST 읽음 처리 */
    roomRead: '/api/dm/rooms/:roomId/read',
    /** GET 대화방 메시지 / POST 메시지 전송 */
    messages: '/api/dm/rooms/:roomId/messages',
  },

  ws: {
    /** POST 웹소켓 입장 토큰. 소켓은 Spring에 직접 연결 */
    ticket: '/api/ws/ticket',
  },

  notifications: {
    /** GET 알림 목록. 조회 시 그때까지 쌓인 안 읽음을 읽음 처리 */
    root: '/api/notifications',
    /** GET 안 읽은 알림 수. 읽음 처리 없음 */
    unreadCount: '/api/notifications/unread-count',
    /** PATCH 단건 읽음 */
    read: '/api/notifications/:notificationId/read',
    /** POST 전체 읽음 */
    readAll: '/api/notifications/read-all',
  },

  settings: {
    /** GET 설정 조회 / PATCH 설정 변경 */
    root: '/api/settings',
    /** GET 내 활동 */
    activities: '/api/settings/activities',
    /** GET / PATCH 알림 설정 */
    notifications: '/api/settings/notifications',
    /** GET / PATCH 공개 범위 */
    privacy: '/api/settings/privacy',
  },

  admin: {
    /** POST 태그 승인 */
    tagApprove: '/api/admin/tags/:tagId/approve',
    /** POST 태그 거절 */
    tagReject: '/api/admin/tags/:tagId/reject',
  },

  /** development + Spring local 전용 */
  test: {
    /** DELETE 내 스토리 읽음 전부 초기화 */
    storyViews: '/api/test/story-views',
    /** POST 닉네임 변경 쿨다운 초기화 */
    nicknameCooldown: '/api/test/nickname-cooldown',
    /** POST 펫 멘션 ID 변경 쿨다운 초기화 */
    mentionIdCooldown: '/api/test/pets/:petId/mention-id-cooldown',
    /** POST development — refreshToken 쿠키만 삭제. Spring 호출 없음 */
    refreshTokenReset: '/api/dev/refresh-token/reset',
  },

  files: {
    /** POST 업로드 (multipart) / GET 목록(있으면) */
    root: '/api/files',
    /** GET 단건 메타 */
    detail: '/api/files/:fileId',
    /** GET 바이너리 프록시 (상대 filePath용 · CDN은 호출 금지) */
    content: '/api/files/:fileId/content',
  },
} as const;

/** Next 서버 → Spring (/api/v1) */
export const springEndpoints = {
  health: {
    /** GET */
    check: '/api/v1/health',
    /** GET */
    db: '/api/v1/health/db',
  },

  auth: {
    /** POST email|phone + password */
    login: '/api/v1/auth/login',
    /** POST */
    refresh: '/api/v1/auth/refresh',
    /** POST */
    logout: '/api/v1/auth/logout',
    /** GET */
    me: '/api/v1/auth/me',
    /** PATCH 회원정보 (닉네임 제외) */
    updateMe: '/api/v1/auth/me',
    /** PATCH 닉네임 */
    changeNickname: '/api/v1/auth/me/nickname',
    /** DELETE */
    withdraw: '/api/v1/auth/me',
    /** POST */
    signup: '/api/v1/auth/signup',
    /** POST */
    phone: '/api/v1/auth/phone',
    /** POST */
    phoneVerify: '/api/v1/auth/phone/verify',
    /** POST */
    passwordToken: '/api/v1/auth/password/token',
    /** PUT 비로그인 변경 (passwordChangeToken) */
    password: '/api/v1/auth/password',
    /** PUT 로그인 중 변경. 비밀번호가 있으면 currentPassword 필수 */
    passwordMe: '/api/v1/auth/password/me',
    /** POST SocialLoginRequest → SocialLoginResponse */
    socialLogin: '/api/v1/auth/social/login',
    /** POST 소셜 계정 연동 (인증 필요) */
    socialLink: '/api/v1/auth/social/link',
    /** DELETE ?provider=GOOGLE|KAKAO */
    socialUnlink: '/api/v1/auth/social/unlink',
  },

  main: {
    /** GET */
    storyOwners: '/api/v1/main/stories/owners',
    /** GET */
    stories: '/api/v1/main/stories',
    /** GET */
    feeds: '/api/v1/main/feeds',
    /** GET 메인 추천 게시글 ?limit= */
    feedsRecommended: '/api/v1/main/feeds/recommended',
    /** GET */
    search: '/api/v1/main/search',
    /** GET 검색 추천 게시글 ?limit= */
    searchRecommended: '/api/v1/main/search/recommended',
    /** GET 최근 검색 5건 / POST { targetUserNo } */
    searchRecent: '/api/v1/main/search/recent',
    /** GET 최근 검색 더보기 ?cursorHistoryId= */
    searchRecentMore: '/api/v1/main/search/recent/more',
  },

  myUltary: {
    /** GET */
    profile: '/api/v1/my-ultary',
    /** GET */
    feeds: '/api/v1/my-ultary/feeds',
    /** GET */
    feedDetail: '/api/v1/my-ultary/feeds/:feedId',
    /** GET */
    savedFeeds: '/api/v1/my-ultary/saved-feeds',
    /** GET */
    taggedFeeds: '/api/v1/my-ultary/tagged-feeds',
    /** PATCH */
    bio: '/api/v1/my-ultary/bio',
    /** GET / POST */
    stories: '/api/v1/my-ultary/stories',
    /** DELETE */
    story: '/api/v1/my-ultary/stories/:storyId',
  },

  stories: {
    /** POST 읽음 — INSERT IGNORE, 본인 스토리 미기록 */
    view: '/api/v1/stories/:storyId/view',
    /** POST 공감 / DELETE 공감 취소 */
    like: '/api/v1/stories/:storyId/like',
  },

  pets: {
    /** GET / POST */
    root: '/api/v1/pets',
    /** PATCH / DELETE */
    detail: '/api/v1/pets/:petId',
    /** PATCH 멘션 ID */
    mentionId: '/api/v1/pets/:petId/mention-id',
    /** POST */
    tagApprove: '/api/v1/pets/tags/:feedPetId/approve',
    /** POST */
    tagReject: '/api/v1/pets/tags/:feedPetId/reject',
  },

  feeds: {
    /** POST */
    root: '/api/v1/feeds',
    /** GET / PATCH / DELETE */
    detail: '/api/v1/feeds/:feedId',
    /** POST / DELETE */
    like: '/api/v1/feeds/:feedId/like',
    /** GET */
    likers: '/api/v1/feeds/:feedId/likers',
    /** POST / DELETE */
    store: '/api/v1/feeds/:feedId/store',
    /** POST */
    share: '/api/v1/feeds/:feedId/share',
    /** GET / POST */
    comments: '/api/v1/feeds/:feedId/comments',
    /** PATCH / DELETE */
    comment: '/api/v1/feeds/:feedId/comments/:commentId',
    /** POST / DELETE */
    commentLike: '/api/v1/feeds/:feedId/comments/:commentId/like',
    /** GET / POST */
    replies: '/api/v1/feeds/:feedId/comments/:commentId/replies',
    /** PATCH / DELETE */
    reply: '/api/v1/feeds/:feedId/comments/:commentId/replies/:replyId',
    /** POST / DELETE */
    replyLike: '/api/v1/feeds/:feedId/comments/:commentId/replies/:replyId/like',
  },

  tags: {
    /** GET */
    detail: '/api/v1/tags/:tagId',
    /** GET */
    search: '/api/v1/tags/search',
    /** GET */
    recommend: '/api/v1/tags/recommend',
    /** POST */
    root: '/api/v1/tags',
  },

  users: {
    /** GET */
    ultary: '/api/v1/users/:userNo/ultary',
    /** GET */
    pets: '/api/v1/users/:userNo/pets',
    /** GET */
    feeds: '/api/v1/users/:userNo/feeds',
    /** GET */
    neighbors: '/api/v1/users/:userNo/neighbors',
    /** POST */
    neighborRequest: '/api/v1/users/:userNo/neighbors/request',
    /** POST */
    neighborAccept: '/api/v1/neighbors/:neighborId/accept',
    /** POST */
    neighborReject: '/api/v1/neighbors/:neighborId/reject',
    /** DELETE */
    neighborCancel: '/api/v1/neighbors/:neighborId',
    /** POST / DELETE */
    block: '/api/v1/users/:userNo/block',
    /** GET 내가 차단한 사용자 */
    blocks: '/api/v1/users/blocks',
    /** POST */
    report: '/api/v1/reports',
  },

  write: {
    /** POST */
    draftPhotos: '/api/v1/write/draft-photos',
    /** POST */
    editedPhoto: '/api/v1/write/edited-photos',
    /** POST */
    photoTags: '/api/v1/write/photo-tags',
  },

  dm: {
    /** GET / POST */
    rooms: '/api/v1/dm/rooms',
    /** DELETE */
    room: '/api/v1/dm/rooms/:roomId',
    /** POST */
    roomRead: '/api/v1/dm/rooms/:roomId/read',
    /** GET / POST */
    messages: '/api/v1/dm/rooms/:roomId/messages',
  },

  ws: {
    /** POST 입장 토큰 */
    ticket: '/api/v1/ws/ticket',
  },

  notifications: {
    /** GET. 목록을 준 뒤 그때까지 안 읽은 알림을 읽음 처리 */
    root: '/api/v1/notifications',
    /** GET 안 읽은 알림 수. 읽음 처리 없음 */
    unreadCount: '/api/v1/notifications/unread-count',
    /** PATCH */
    read: '/api/v1/notifications/:notificationId/read',
    /** POST */
    readAll: '/api/v1/notifications/read-all',
  },

  settings: {
    /** GET / PATCH */
    root: '/api/v1/settings',
    /** GET 내 활동 */
    activities: '/api/v1/settings/activities',
    /** GET / PATCH 알림 설정 */
    notifications: '/api/v1/settings/notifications',
    /** GET / PATCH 공개 범위 */
    privacy: '/api/v1/settings/privacy',
  },

  admin: {
    /** POST */
    tagApprove: '/api/v1/admin/tags/:tagId/approve',
    /** POST */
    tagReject: '/api/v1/admin/tags/:tagId/reject',
  },

  /** Spring @Profile("local") only */
  test: {
    /** DELETE Bearer — 내 ultary_story_view 전부 삭제 */
    storyViews: '/api/v1/test/story-views',
    /** POST Bearer — nickname_changed_at 을 올해 1월 1일로 */
    nicknameCooldown: '/api/v1/test/nickname-cooldown',
    /** POST Bearer — mention_id_changed_at 을 올해 1월 1일로 */
    mentionIdCooldown: '/api/v1/test/pets/:petId/mention-id-cooldown',
  },

  files: {
    /** POST multipart 업로드 / GET */
    root: '/api/v1/files',
    /** GET 단건 메타 */
    detail: '/api/v1/files/:fileId',
    /** GET 바이너리 — 상대 filePath만. CDN 절대 URL에는 호출하지 않음 */
    content: '/api/v1/files/:fileId/content',
  },
} as const;

export type BffEndpoints = typeof bffEndpoints;
export type SpringEndpoints = typeof springEndpoints;

/** @deprecated springEndpoints 사용 */
export const endpoints = springEndpoints;
export type Endpoints = SpringEndpoints;
