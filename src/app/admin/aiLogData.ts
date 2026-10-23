export type AiLog = {
  aiRequestId: number;
  userNo: number | null;
  featureType: string;
  targetFeedId: number | null;
  targetType: string | null;
  targetId: number | null;
  moderationJobId: number | null;
  contentVersion: number | null;
  attemptNo: number | null;
  modelName: string | null;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  latencyMs: number | null;
  httpStatus: number | null;
  createdAt: string | null;
  jobStatus: string | null;
  resultAction: string | null;
  jobAttemptCount: number | null;
  nextAttemptAt: string | null;
  adminReviewStatus: string | null;
  adminReviewedAt: string | null;
  inspectionContent: string | null;
};

export type AiLogPage = { items: AiLog[]; nextCursorAiRequestId: number | null; totalCount: number };

export const AI_FEATURE: Record<string, string> = {
  FEED_CAPTION: '게시글 검사', COMMENT_FILTER: '댓글·답글 검사', HASHTAG: '태그 추천',
  PET_PROFILE: '반려동물 프로필', ALT_TEXT: '대체 텍스트',
};
export const AI_STATUS: Record<string, string> = {
  FAILED: '실패', SUCCESS: '성공', PENDING: '대기', PROCESSING: '검사 중',
  APPROVED: '승인', REJECTED: '부적절 판정', SUPERSEDED: '후속 수정으로 조치 생략', SKIPPED: '검사 생략',
};
export const AI_ACTION: Record<string, string> = { RESTORED: '이전 본문 복구', HIDDEN: '숨김 처리' };

export function aiDuration(ms: number | null) {
  return ms == null ? '기록 없음' : `${(ms / 1000).toFixed(2)}초`;
}
