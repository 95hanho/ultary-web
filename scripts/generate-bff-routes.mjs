import fs from 'node:fs';
import path from 'node:path';

const root = path.join('src', 'app', 'api');

/**
 * routePath -> method -> 한글 로그 라벨
 * @type {Record<string, Record<string, string>>}
 */
const routes = {
  health: {
    GET: '헬스체크',
  },

  'auth/login': { POST: '로그인' },
  'auth/refresh': { POST: '로그인 토큰 재발급' },
  'auth/logout': { POST: '로그아웃' },
  'auth/me': {
    GET: '내 회원정보 조회',
    PATCH: '회원정보 변경',
    DELETE: '회원탈퇴',
  },
  'auth/signup': { POST: '회원가입' },
  'auth/login-id/check': { GET: '아이디 중복확인' },
  'auth/phone': { POST: '휴대폰 인증' },
  'auth/phone/verify': { POST: '휴대폰 인증 확인' },
  'auth/password/token': { POST: '비밀번호 변경 토큰 생성' },
  'auth/password': { PUT: '비밀번호 변경' },
  'auth/social/google': { GET: '구글 소셜 로그인 시작' },
  'auth/social/google/callback': { GET: '구글 소셜 로그인 콜백' },
  'auth/social/kakao': { GET: '카카오 소셜 로그인 시작' },
  'auth/social/kakao/callback': { GET: '카카오 소셜 로그인 콜백' },
  'auth/social/link': { POST: '소셜 계정 연동' },
  'auth/social/unlink': { DELETE: '소셜 계정 연동 해제' },

  'main/stories/owners': { GET: '주민 스토리 보유 목록 조회' },
  'main/stories': { GET: '주민 스토리 조회' },
  'main/feeds': { GET: '주민 게시글 조회' },
  'main/search': { GET: '검색' },

  'my-ultary': { GET: '마이울타리 정보 조회' },
  'my-ultary/feeds': { GET: 'MY 게시글 그리드 조회' },
  'my-ultary/feeds/[feedId]': { GET: 'MY 게시글 상세 조회' },
  'my-ultary/saved-feeds': { GET: '저장한 게시글 조회' },
  'my-ultary/tagged-feeds': { GET: '태그된 게시글 조회' },
  'my-ultary/profile-image': { PATCH: '프로필 사진 변경' },
  'my-ultary/bio': { PATCH: '소개글 변경' },
  'my-ultary/stories': { POST: '스토리 등록' },
  'my-ultary/stories/[storyId]': { DELETE: '스토리 삭제' },

  pets: {
    GET: '반려동물 목록 조회',
    POST: '반려동물 등록',
  },
  'pets/[petId]': {
    PATCH: '반려동물 수정',
    DELETE: '반려동물 삭제',
  },
  'pets/tags/[feedPetId]/approve': { POST: '피드 반려동물 태그 승인' },
  'pets/tags/[feedPetId]/reject': { POST: '피드 반려동물 태그 거절' },

  feeds: { POST: '게시글 등록' },
  'feeds/[feedId]': {
    GET: '게시글 상세 조회',
    PATCH: '게시글 수정',
    DELETE: '게시글 삭제',
  },
  'feeds/[feedId]/like': {
    POST: '게시글 좋아요',
    DELETE: '게시글 좋아요 취소',
  },
  'feeds/[feedId]/likers': { GET: '게시글 좋아요한 사람 목록' },
  'feeds/[feedId]/store': {
    POST: '게시글 저장',
    DELETE: '게시글 저장 해제',
  },
  'feeds/[feedId]/share': { POST: '게시글 공유' },
  'feeds/[feedId]/comments': {
    GET: '댓글 목록 조회',
    POST: '댓글 작성',
  },
  'feeds/[feedId]/comments/[commentId]': {
    PATCH: '댓글 수정',
    DELETE: '댓글 삭제',
  },
  'feeds/[feedId]/comments/[commentId]/replies': {
    GET: '답글 목록 조회',
    POST: '답글 작성',
  },
  'feeds/[feedId]/comments/[commentId]/replies/[replyId]': {
    PATCH: '답글 수정',
    DELETE: '답글 삭제',
  },

  tags: { POST: '태그 등록' },
  'tags/search': { GET: '태그 검색' },
  'tags/recommend': { GET: '태그 추천' },
  'tags/[tagId]': { GET: '태그 정보 조회' },

  'users/[userNo]/ultary': { GET: '다른 유저 울타리 정보 조회' },
  'users/[userNo]/neighbors': { GET: '주민·이웃 목록 조회' },
  'users/[userNo]/neighbors/request': { POST: '주민 요청' },
  'users/[userNo]/block': {
    POST: '유저 차단',
    DELETE: '유저 차단 해제',
  },
  'neighbors/[neighborId]/accept': { POST: '주민 요청 수락' },
  'neighbors/[neighborId]/reject': { POST: '주민 요청 거절' },
  'neighbors/[neighborId]': { DELETE: '주민 요청 취소·이웃 해제' },
  reports: { POST: '신고' },

  'write/draft-photos': { POST: '작성 사진 임시저장' },
  'write/edited-photos': { POST: '편집 사진 저장' },
  'write/photo-tags': { POST: '사진 태그 저장' },

  'dm/rooms': {
    GET: 'DM 대화방 리스트 조회',
    POST: 'DM 대화방 생성',
  },
  'dm/rooms/[roomId]': { DELETE: 'DM 대화방 나가기' },
  'dm/rooms/[roomId]/read': { POST: 'DM 읽음 처리' },
  'dm/rooms/[roomId]/messages': {
    GET: 'DM 메시지 조회',
    POST: 'DM 메시지 전송',
  },

  notifications: { GET: '알림 목록 조회' },
  'notifications/read-all': { POST: '알림 전체 읽음' },
  'notifications/[notificationId]/read': { PATCH: '알림 단건 읽음' },

  settings: {
    GET: '설정 조회',
    PATCH: '설정 변경',
  },

  'admin/tags/[tagId]/approve': { POST: '관리자 태그 승인' },
  'admin/tags/[tagId]/reject': { POST: '관리자 태그 거절' },
};

for (const [routePath, methodLabels] of Object.entries(routes)) {
  const dir = path.join(root, ...routePath.split('/'));
  fs.mkdirSync(dir, { recursive: true });

  const methods = Object.keys(methodLabels);
  const feature = routePath.replace(/\[|\]/g, ':');

  const handlers = methods
    .map((method) => {
      const label = methodLabels[method];
      return `export async function ${method}() {
  console.log('[API] ${label}');
  try {
    // TODO: springFetch 연동
    return notImplemented('${feature} ${method}');
  } catch (err) {
    return handleBffError(err);
  }
}`;
    })
    .join('\n\n');

  const content = `import { handleBffError, notImplemented } from '@/lib/api/bffRoute';

/** BFF /api/${routePath} — ${methods.join('/')} */
${handlers}
`;

  fs.writeFileSync(path.join(dir, 'route.ts'), content, 'utf8');
}

console.log(`updated ${Object.keys(routes).length} route files`);
