/**
 * springFetch — Next.js 서버 → Spring (업스트림)
 *
 * 기본은 form / urlencoded / multipart.
 * JSON은 거의 쓰지 않으므로 postJson은 예외용으로만 둔다.
 *
 * ApiResponse<T> 성공 응답이면 data만 꺼내 반환한다.
 */

import 'server-only';

import { SPRING_BASE_URL } from '@/lib/env.server';
import {
  applyPathParams,
  applyPathParamsFromBody,
  cloneParams,
  http,
  toFormData,
  toSearchParams,
  toUrlEncodedBody,
  type Params,
  type RequestHeaders,
} from '@/lib/api/http';
import type { ApiResponse } from '@/types/api';
import { isRecord } from '@/lib/api/error';

const withSpring = <T>(url: string, init?: Parameters<typeof http<T>>[1]) =>
  http<T>(url, { baseUrl: SPRING_BASE_URL, ...init });

function unwrapApiData<T>(raw: unknown): T {
  if (
    isRecord(raw) &&
    raw.success === true &&
    Object.prototype.hasOwnProperty.call(raw, 'data')
  ) {
    return (raw as ApiResponse<T>).data as T;
  }
  return raw as T;
}

async function springHttp<T>(
  url: string,
  init?: Parameters<typeof http<unknown>>[1],
): Promise<T> {
  const raw = await withSpring<unknown>(url, init);
  return unwrapApiData<T>(raw);
}

/** GET + query */
export function springGet<T>(
  url: string,
  params?: Params,
  headers?: RequestHeaders,
) {
  const [path, rest] = applyPathParams(url, cloneParams(params));
  const qs =
    rest && Object.keys(rest).length > 0
      ? `?${toSearchParams(rest).toString()}`
      : '';
  return springHttp<T>((path + qs).replace(/ /g, '%20'), { headers });
}

/** 파일 다운로드 */
export function springDownload(
  url: string,
  params?: Params,
  headers?: RequestHeaders,
) {
  const [path, rest] = applyPathParams(url, cloneParams(params));
  const qs =
    rest && Object.keys(rest).length > 0
      ? `?${toSearchParams(rest).toString()}`
      : '';
  return withSpring<Blob>((path + qs).replace(/ /g, '%20'), { headers });
}

/** POST application/x-www-form-urlencoded */
export function springPostForm<T>(
  url: string,
  params: Params,
  headers?: RequestHeaders,
) {
  const [path, body] = applyPathParams(url, cloneParams(params));
  return springHttp<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(headers ?? {}),
    },
    body: toUrlEncodedBody(body),
  });
}

/** PUT application/x-www-form-urlencoded */
export function springPutForm<T>(
  url: string,
  params: Params,
  headers?: RequestHeaders,
) {
  const [path, body] = applyPathParams(url, cloneParams(params));
  return springHttp<T>(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(headers ?? {}),
    },
    body: toUrlEncodedBody(body),
  });
}

/** POST FormData (단순 필드/파일) — Content-Type 수동 설정 금지 */
export function springPostFormData<T>(
  url: string,
  params: Params,
  headers?: RequestHeaders,
) {
  const [path, body] = applyPathParams(url, cloneParams(params));
  return springHttp<T>(path, {
    method: 'POST',
    headers,
    body: toFormData(body),
  });
}

/** POST FormData (이미 만든 FormData) */
export function springPostMultipart<T>(
  url: string,
  formData: FormData,
  headers?: RequestHeaders,
) {
  return springHttp<T>(url, {
    method: 'POST',
    headers,
    body: formData,
  });
}

/** DELETE + query */
export function springDelete<T>(
  url: string,
  params?: Params,
  headers?: RequestHeaders,
) {
  const [path, rest] = applyPathParams(url, cloneParams(params));
  const qs =
    rest && Object.keys(rest).length > 0
      ? `?${toSearchParams(rest).toString()}`
      : '';
  return springHttp<T>((path + qs).replace(/ /g, '%20'), {
    method: 'DELETE',
    headers,
  });
}

/**
 * POST JSON — 예외용.
 * Spring은 기본적으로 form을 쓰고, JSON이 필요한 엔드포인트만 사용.
 */
export function springPostJson<TRes, TBody extends object = object>(
  url: string,
  body?: TBody,
  headers?: RequestHeaders,
) {
  const [path, restBody] = applyPathParamsFromBody(url, body);
  return springHttp<TRes>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(restBody ?? {}),
  });
}

/** PATCH JSON — 예외용 */
export function springPatchJson<TRes, TBody extends object = object>(
  url: string,
  body?: TBody,
  headers?: RequestHeaders,
) {
  const [path, restBody] = applyPathParamsFromBody(url, body);
  return springHttp<TRes>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(restBody ?? {}),
  });
}
