/**
 * 공통 fetch 유틸.
 *
 * 호출 계층 이름:
 * - bff    : 브라우저/클라이언트 → Next.js Route Handler (BFF)
 * - spring : Next.js 서버 → Spring (업스트림)
 */

import { isHttpError, isRecord, type HttpError } from '@/lib/api/error';

export type Primitive = string | number | boolean | null;
export type ParamValue =
  | Primitive
  | Blob
  | File
  | FileList
  | Primitive[]
  | undefined;
export type Params = Record<string, ParamValue>;

type AuthorizationHeader = `Bearer ${string}`;
export type RequestHeaders = {
  Authorization?: AuthorizationHeader;
  'user-agent'?: string;
  'x-forwarded-for'?: string;
} & Record<string, string>;

type BodyLike = object;

const isServer = typeof window === 'undefined';

export const cloneParams = (params?: Params): Params | undefined =>
  params ? { ...params } : undefined;

/** `:id` path param 치환 (원본 불변) */
export const applyPathParams = (
  url: string,
  params?: Params,
): [string, Params | undefined] => {
  if (!params) return [url, params];

  const rest: Params = { ...params };
  const newUrl = url.replace(/:([^/]+)/g, (_, name: string) => {
    if (rest[name] !== undefined) {
      const v = rest[name];
      delete rest[name];
      return String(Array.isArray(v) ? v[0] : v);
    }
    return _;
  });

  return [newUrl, rest];
};

/** JSON body에서 `:id` 치환 */
export const applyPathParamsFromBody = <T extends BodyLike | undefined>(
  url: string,
  body: T,
): [string, T] => {
  if (!body) return [url, body];

  const rest = { ...(body as Record<string, unknown>) };
  const newUrl = url.replace(/:([^/]+)/g, (_, name: string) => {
    if (Object.prototype.hasOwnProperty.call(rest, name)) {
      const v = rest[name];
      delete rest[name];

      if (Array.isArray(v)) return String(v[0] ?? '');
      if (v === null) return 'null';
      if (
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean'
      ) {
        return String(v);
      }
    }
    return _;
  });

  return [newUrl, rest as T];
};

export const toSearchParams = (params: Params): URLSearchParams => {
  const search = new URLSearchParams();

  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        if (typeof item === 'number' && Number.isNaN(item)) continue;
        search.append(key, String(item));
      }
      continue;
    }

    if (typeof value === 'number' && Number.isNaN(value)) continue;
    search.append(key, String(value));
  }

  return search;
};

export const toUrlEncodedBody = (params?: Params): string => {
  const sp = new URLSearchParams();
  if (!params) return sp.toString();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return;
    if (Array.isArray(v)) {
      v.forEach((i) => sp.append(k, String(i)));
      return;
    }
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    ) {
      sp.append(k, String(v));
    }
  });

  return sp.toString();
};

export const toFormData = (params?: Params): FormData => {
  const formData = new FormData();
  if (!params) return formData;

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value) || value instanceof FileList) {
      for (const v of value) {
        formData.append(key, v instanceof Blob ? v : String(v));
      }
      return;
    }
    if (value !== undefined && value !== null) {
      formData.append(key, value instanceof Blob ? value : String(value));
    }
  });

  return formData;
};

const withTimeout = (ms: number) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(id) };
};

const extractMessage = (raw: unknown, fallback: string) => {
  if (isRecord(raw)) {
    const detail = raw.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;

    const msg = raw.msg;
    if (typeof msg === 'string' && msg.trim()) return msg;

    const message = raw.message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  if (typeof raw === 'string' && raw.trim()) return raw;
  return fallback;
};

export type HttpInit = RequestInit & {
  baseUrl?: string;
  timeoutMs?: number;
};

/** 공통 fetch: ok 체크 + JSON/텍스트/Blob 파싱 */
export async function http<T>(url: string, init?: HttpInit): Promise<T> {
  const fullUrl = (init?.baseUrl ?? '') + url;
  const { timeoutMs = 20000, baseUrl: _baseUrl, ...rest } = init ?? {};
  const timer = withTimeout(timeoutMs);

  try {
    const res = await fetch(fullUrl, {
      credentials: 'include',
      cache: 'no-store',
      ...rest,
      signal: timer.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(rest.headers ?? {}),
      },
    });

    if (res.status === 204) return undefined as unknown as T;

    const ct = res.headers.get('content-type') ?? '';
    let raw: unknown;

    if (ct.includes('application/json')) {
      raw = await res.json().catch(async () => ({
        _raw: await res.text(),
      }));
    } else if (ct.startsWith('text/') || ct.includes('application/xml')) {
      raw = await res.text();
    } else {
      raw = await res.blob();
    }

    if (!res.ok) {
      const message = extractMessage(raw, res.statusText || 'REQUEST_FAILED');
      const err: HttpError = { message, status: res.status, data: raw, url };
      throw err;
    }

    return raw as T;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const status = isServer ? 504 : 0;
      const e: HttpError = {
        message: 'REQUEST_TIMEOUT',
        status,
        data: null,
        url,
      };
      throw e;
    }

    if (err instanceof TypeError) {
      const status = isServer ? 502 : 0;
      const e: HttpError = {
        message: 'NETWORK_ERROR',
        status,
        data: null,
        url,
      };
      throw e;
    }

    if (isHttpError(err)) throw err;

    const e: HttpError = {
      message: 'SERVER_ERROR',
      status: 500,
      data: err,
      url,
    };
    throw e;
  } finally {
    timer.clear();
  }
}
