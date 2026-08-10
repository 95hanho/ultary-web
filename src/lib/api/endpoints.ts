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
    /** PATCH 회원정보 변경 */
    updateMe: '/api/auth/me',
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
    /** PUT 비밀번호 변경 */
    password: '/api/auth/password',
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
    /** GET 검색 ?q=&type= */
    search: '/api/main/search',
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
    /** PATCH 프로필 사진 */
    profileImage: '/api/my-ultary/profile-image',
    /** PATCH 소개글 */
    bio: '/api/my-ultary/bio',
    /** POST 스토리 등록 */
    stories: '/api/my-ultary/stories',
    /** DELETE 스토리 삭제 */
    story: '/api/my-ultary/stories/:storyId',
  },

  pets: {
    /** GET 목록 / POST 등록 */
    root: '/api/pets',
    /** PATCH 수정 / DELETE 삭제 */
    detail: '/api/pets/:petId',
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
    /** GET 답글 목록 / POST 답글 작성 */
    replies: '/api/feeds/:feedId/comments/:commentId/replies',
    /** PATCH 답글 수정 / DELETE 답글 삭제 */
    reply: '/api/feeds/:feedId/comments/:commentId/replies/:replyId',
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

  notifications: {
    /** GET 알림 목록 */
    root: '/api/notifications',
    /** PATCH 단건 읽음 */
    read: '/api/notifications/:notificationId/read',
    /** POST 전체 읽음 */
    readAll: '/api/notifications/read-all',
  },

  settings: {
    /** GET 설정 조회 / PATCH 설정 변경(공개범위 등) */
    root: '/api/settings',
  },

  admin: {
    /** POST 태그 승인 */
    tagApprove: '/api/admin/tags/:tagId/approve',
    /** POST 태그 거절 */
    tagReject: '/api/admin/tags/:tagId/reject',
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
    /** PATCH */
    updateMe: '/api/v1/auth/me',
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
    /** PUT */
    password: '/api/v1/auth/password',
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
    /** GET */
    search: '/api/v1/main/search',
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
    profileImage: '/api/v1/my-ultary/profile-image',
    /** PATCH */
    bio: '/api/v1/my-ultary/bio',
    /** POST */
    stories: '/api/v1/my-ultary/stories',
    /** DELETE */
    story: '/api/v1/my-ultary/stories/:storyId',
  },

  pets: {
    /** GET / POST */
    root: '/api/v1/pets',
    /** PATCH / DELETE */
    detail: '/api/v1/pets/:petId',
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
    /** GET / POST */
    replies: '/api/v1/feeds/:feedId/comments/:commentId/replies',
    /** PATCH / DELETE */
    reply: '/api/v1/feeds/:feedId/comments/:commentId/replies/:replyId',
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

  notifications: {
    /** GET */
    root: '/api/v1/notifications',
    /** PATCH */
    read: '/api/v1/notifications/:notificationId/read',
    /** POST */
    readAll: '/api/v1/notifications/read-all',
  },

  settings: {
    /** GET / PATCH */
    root: '/api/v1/settings',
  },

  admin: {
    /** POST */
    tagApprove: '/api/v1/admin/tags/:tagId/approve',
    /** POST */
    tagReject: '/api/v1/admin/tags/:tagId/reject',
  },
} as const;

export type BffEndpoints = typeof bffEndpoints;
export type SpringEndpoints = typeof springEndpoints;

/** @deprecated springEndpoints 사용 */
export const endpoints = springEndpoints;
export type Endpoints = SpringEndpoints;
