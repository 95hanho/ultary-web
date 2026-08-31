# BFF 개발 가이드

## 새 Route Handler 구현 순서

1. `docs/api-memo.md` / `endpoints.ts`에 BFF·Spring 경로가 있는지 확인
2. `src/app/api/.../route.ts` 스켈레톤의 `notImplemented`를 Spring 연동으로 교체
3. 필요한 Request/Response 타입을 `src/types/`에 추가
4. `http/bff.http`에 요청 예시 추가 (없으면)
5. Spring 서버 기동 후 REST Client로 검증

## Route Handler 패턴

### 인증 필요 GET

```typescript
import { NextResponse } from 'next/server';
import { springEndpoints } from '@/lib/api/endpoints';
import { handleBffError } from '@/lib/api/bffRoute';
import { springGet } from '@/lib/api/springFetch';
import { getAccessToken } from '@/lib/auth/cookies';

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { message: 'UNAUTHORIZED', detail: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const data = await springGet(springEndpoints.pets.root, undefined, {
      Authorization: `Bearer ${accessToken}`,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    return handleBffError(err);
  }
}
```

### JSON POST (Spring도 JSON)

auth 계열처럼 Spring이 JSON body를 받는 경우:

```typescript
const data = await springPostJson(springEndpoints.auth.login, body);
```

### Form / Multipart (Spring 기본)

대부분의 도메인 API는 form 또는 multipart:

```typescript
// application/x-www-form-urlencoded
await springPostForm(springEndpoints.feeds.root, { content: '...' }, headers);

// 파일 업로드
await springPostFormData(springEndpoints.myUltary.profileImage, { file }, headers);
```

### Path parameter

`endpoints.ts`의 `:petId` 형태는 `springGet`/`springPostForm` 등에 params로 전달:

```typescript
await springGet(
  springEndpoints.pets.detail,
  { petId: params.petId },
  headers,
);
```

Next dynamic segment는 `route.ts`의 `{ params }`에서 받는다:

```typescript
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ petId: string }> },
) {
  const { petId } = await params;
  // ...
}
```

## fetch 계층 선택

| 호출 주체 | 사용 | 위치 |
|-----------|------|------|
| React 컴포넌트 / 클라이언트 | `bffFetch` | `src/lib/api/bffFetch.ts` |
| Route Handler → Spring | `springFetch` | `src/lib/api/springFetch.ts` (`server-only`) |

`springFetch`는 성공 시 `ApiResponse.data`만 반환한다. BFF 응답 shape은 Route Handler에서 `{ success, data }`로 감싼다.

## 에러 처리

- Spring/네트워크 오류: `catch` → `handleBffError(err)`
- BFF 입력 검증: `400` + `{ message, detail }`
- 미구현: `notImplemented('feature name')` → 501

## 로깅

스켈레톤과 동일하게 handler 진입 시 `console.log('[API] ...')` 유지.

## 수동 테스트

1. Spring: `ultary-api` 로컬 (`9377` 또는 `9378`)
2. Next: `npm run dev` (`3000`)
3. VS Code REST Client: `http/bff.http`

인증 필요 API는 먼저 `POST /api/auth/login` 또는 소셜 로그인으로 쿠키를 받은 뒤 호출한다.

## 체크리스트

- [ ] `springEndpoints` 경로 사용 (문자열 하드코딩 금지)
- [ ] 인증 API는 쿠키 → Bearer 헤더
- [ ] 토큰 발급 API는 `setAuthCookies` / 로그아웃·탈퇴는 `clearAuthCookies`
- [ ] 타입은 `src/types/`에 정의
- [ ] `http/bff.http` 예시 갱신
