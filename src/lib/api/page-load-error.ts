import { isHttpError } from './error';

/** 페이지 조회에서만 사용한다. 작성·수정 실패는 기존 모달/안내로 처리한다. */
export function isUnavailablePageError(error: unknown): boolean {
  return isHttpError(error) && [404, 410].includes(error.status);
}
