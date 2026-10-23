export type HttpError = {
  message: string;
  status: number;
  data: unknown;
  url: string;
};

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

export const isHttpError = (err: unknown): err is HttpError =>
  isRecord(err) &&
  typeof err.message === 'string' &&
  typeof err.status === 'number' &&
  typeof err.url === 'string' &&
  'data' in err;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  isRecord(v) && !Array.isArray(v);

export type ErrorResponse = {
  status: number;
  payload: Record<string, unknown>;
};

const HTTP_ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
  500: 'INTERNAL_SERVER_ERROR', 502: 'BAD_GATEWAY', 503: 'SERVICE_UNAVAILABLE', 504: 'GATEWAY_TIMEOUT',
};

/** HTTP 응답이 없는 브라우저 통신 실패도 화면/API에서 같은 의미로 분류한다. */
export function httpErrorStatus(error: unknown): number {
  if (!isHttpError(error)) return 500;
  if (error.status === 0) return error.message === 'REQUEST_TIMEOUT' ? 504 : 502;
  return Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? error.status : 500;
}

/** BFF Route Handler에서 Spring/네트워크 에러를 Next 응답으로 변환할 때 사용 */
export const toErrorResponse = (err: unknown): ErrorResponse => {
  if (isHttpError(err)) {
    const status = httpErrorStatus(err);
    const payload = isPlainObject(err.data)
      ? err.data
      : { message: err.message || 'SERVER_ERROR' };

    const code = typeof payload.code === 'string' && payload.code
      ? payload.code
      : /^[A-Z][A-Z0-9_]*$/.test(err.message) ? err.message : HTTP_ERROR_CODES[status] ?? `HTTP_${status}`;
    return { status, payload: { ...payload, status, code } };
  }

  return {
    status: 500,
    payload: {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: err instanceof Error ? err.message : 'SERVER_ERROR',
    },
  };
};
