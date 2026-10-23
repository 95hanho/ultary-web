export function PhoneDemoCode({ code }: { code: string }) {
  return code ? <p role="status" style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--brand-gray-600)' }}>데모모드 인증번호 : {code}</p> : null;
}
