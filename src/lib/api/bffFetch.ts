/**
 * bffFetch — 브라우저/클라이언트 → Next.js BFF (Route Handler)
 *
 * 요청은 JSON만 사용한다.
 */

import { BFF_BASE_URL } from '@/lib/env.client';
import { isHttpError, isRecord } from '@/lib/api/error';
import {
  applyPathParams,
  applyPathParamsFromBody,
  http,
  toSearchParams,
  type Params,
  type RequestHeaders,
} from '@/lib/api/http';

const withBff = async <T>(url: string, init?: Parameters<typeof http<T>>[1]) => {
  try {
    return await http<T>(url, { baseUrl: BFF_BASE_URL, ...init });
  } catch (error) {
    if (typeof window !== 'undefined' && !url.startsWith('/api/admin/') && isHttpError(error)
      && error.status === 401 && (error.message === 'REFRESH_UNAUTHORIZED'
        || (isRecord(error.data) && error.data.code === 'REFRESH_UNAUTHORIZED'))) {
      window.location.replace('/login');
    }
    throw error;
  }
};

/** GET + query */
export function bffGet<T>(
  url: string,
  params?: Params,
  headers?: RequestHeaders,
  options?: { timeoutMs?: number },
) {
  const [path, rest] = applyPathParams(url, params ? { ...params } : undefined);
  const qs =
    rest && Object.keys(rest).length > 0
      ? `?${toSearchParams(rest).toString()}`
      : '';
  return withBff<T>((path + qs).replace(/ /g, '%20'), { headers, ...options });
}

/** POST JSON */
export function bffPostJson<TRes, TBody extends object = object>(
  url: string,
  body?: TBody,
  headers?: RequestHeaders,
) {
  const [path, restBody] = applyPathParamsFromBody(url, body);
  return withBff<TRes>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(restBody ?? {}),
  });
}

/** PUT JSON */
export function bffPutJson<TRes, TBody extends object = object>(
  url: string,
  body?: TBody,
  headers?: RequestHeaders,
) {
  const [path, restBody] = applyPathParamsFromBody(url, body);
  return withBff<TRes>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(restBody ?? {}),
  });
}

/** PATCH JSON */
export function bffPatchJson<TRes, TBody extends object = object>(
  url: string,
  body?: TBody,
  headers?: RequestHeaders,
) {
  const [path, restBody] = applyPathParamsFromBody(url, body);
  return withBff<TRes>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: JSON.stringify(restBody ?? {}),
  });
}

/** DELETE + query */
export function bffDelete<T>(
  url: string,
  params?: Params,
  headers?: RequestHeaders,
) {
  const [path, rest] = applyPathParams(url, params ? { ...params } : undefined);
  const qs =
    rest && Object.keys(rest).length > 0
      ? `?${toSearchParams(rest).toString()}`
      : '';
  return withBff<T>((path + qs).replace(/ /g, '%20'), {
    method: 'DELETE',
    headers,
  });
}
