/**
 * 오픈 리다이렉트 방지 — 상대 경로만 허용.
 */
export function sanitizeReturnUrl(
  raw: string | null | undefined,
  fallback = '/',
): string {
  if (!raw?.trim()) return fallback;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // keep raw
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }
  if (value.startsWith('/login') || value.startsWith('/signup')) {
    return fallback;
  }
  return value;
}

/** 로그인 입력 → Spring LoginRequest (email | phone) */
export function toLoginRequest(loginId: string, password: string) {
  const trimmed = loginId.trim();
  if (trimmed.includes('@')) {
    return { email: trimmed, password };
  }
  const phone = trimmed.replace(/\D/g, '');
  return { phone: phone || trimmed, password };
}
