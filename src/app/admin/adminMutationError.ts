import { isHttpError, isRecord } from '@/lib/api/error';
import { useModalStore } from '@/stores/modal.store';

export const ADMIN_FORBIDDEN_MESSAGE = '권한이 없습니다. 조회 전용 계정은 조작할 수 없습니다.';

/** OPERATOR 등 조작 불가 계정에서 오는 403 / FORBIDDEN */
export function isAdminForbidden(err: unknown): boolean {
  if (!isHttpError(err)) return false;
  if (err.status === 403) return true;
  if (err.message === 'FORBIDDEN') return true;
  if (isRecord(err.data)) {
    if (err.data.code === 'FORBIDDEN') return true;
    if (err.data.message === 'FORBIDDEN') return true;
  }
  return false;
}

export function adminMutationErrorMessage(
  err: unknown,
  fallback = '처리하지 못했습니다.',
): string {
  if (isAdminForbidden(err)) return ADMIN_FORBIDDEN_MESSAGE;
  if (isHttpError(err) && isRecord(err.data)) {
    const detail = err.data.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
  }
  if (isHttpError(err) && err.message.trim() && err.message !== 'FORBIDDEN') {
    return err.message;
  }
  return fallback;
}

/**
 * 관리자 조작 실패 시 알림 모달.
 * 권한 없음(403)은 고정 문구. message를 넘기면 그 외 오류에만 쓴다.
 */
export function notifyAdminMutationError(err: unknown, message?: string) {
  useModalStore.getState().open({
    variant: 'alert',
    title: '알림창',
    content: isAdminForbidden(err)
      ? ADMIN_FORBIDDEN_MESSAGE
      : (message ?? adminMutationErrorMessage(err)),
    showCloseButton: true,
  });
}
