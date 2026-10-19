import { isHttpError, isRecord } from '@/lib/api/error';
import { useModalStore } from '@/stores/modal.store';

export const AI_CONTENT_BLOCKED = 'AI_CONTENT_BLOCKED';

const FALLBACK_MESSAGE = '등록할 수 없는 표현이 포함되어 있습니다.';

/** 서버 유해 콘텐츠 차단 응답인지 */
export function isAiContentBlocked(err: unknown): boolean {
  if (!isHttpError(err) || !isRecord(err.data)) return false;
  return err.data.code === AI_CONTENT_BLOCKED;
}

/** 서버 message/detail 우선, 없으면 기본 문구 */
export function readAiContentBlockedMessage(err: unknown): string | null {
  if (!isAiContentBlocked(err)) return null;
  if (!isHttpError(err) || !isRecord(err.data)) return FALLBACK_MESSAGE;
  const detail = err.data.detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  const message = err.data.message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  if (err.message.trim() && err.message !== 'REQUEST_FAILED') return err.message.trim();
  return FALLBACK_MESSAGE;
}

/** 유해 콘텐츠 차단 알림. 차단이면 true */
export function notifyAiContentBlocked(err: unknown): boolean {
  const message = readAiContentBlockedMessage(err);
  if (!message) return false;
  useModalStore.getState().open({
    variant: 'alert',
    title: '알림창',
    content: message,
    showCloseButton: true,
    okButton: { label: '확인', tone: 'primary' },
    cancelButton: { hidden: true },
  });
  return true;
}
