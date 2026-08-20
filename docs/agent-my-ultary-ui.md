# Agent 명령 — 마이울타리 UI

> 집에서 Cursor Agent에 붙여넣어 사용.

---

해당 2~3번째 이미지의 UI를 `src/app/(main)/my-ultary/page.tsx`에 만들어줘. 너가 해준거 디테일한거 내가 수정할게. 페이지 클라이언트 컴포넌트로 나눠주고. 프로필사진은 `Profile.tsx` 이용해주고. 첫 번째 이미지는 여기 페이지에 필요한 거 `public/images/icon`에 넣은거야 너가 제대로 인식이 안되거나 내가 잘 못 넣는거는 후 수정할게.

몇 가지 사항을 설명하자면

- 자기 계정일 때만 소개글 수정을 위해 연필표시가 보이고, pet의 톱니바퀴 아이콘도 보여.

---

## 참고 (프로젝트 컨벤션)

- 페이지: `page.tsx` (서버) + `*Client.tsx` (`'use client'`)
- SCSS module: 페이지 `my-ultary.module.scss`(소문자), 컴포넌트 `PascalCase.module.scss`
- 공통 프로필: `src/components/my-ultary/Profile.tsx` — `size`, `story` (`none` | `read` | `unread`)
- 하단 메뉴: `FooterMenu` (main layout에서 연결 여부 확인)
- 아이콘 경로: `/images/icon/...` (예: `Edit.svg`, `Setting_fill.svg`, `Group_light.svg`, `Order.svg`, `cake.svg`, `multi.svg` 등)
- 목업 이미지: `public/images/mock/`

## 아이콘 (이번에 추가됨)

| 파일 | 용도(추정) |
|------|------------|
| `Edit.svg` | 소개글 수정(연필) |
| `Setting_fill.svg` | pet 설정(톱니) |
| `Group_light.svg` / `Group_light_on.svg` | 주민/그룹 |
| `Order.svg` / `Order_on.svg` | 정렬 |
| `Pin_on.svg`, `Pin copy.svg` | 저장/핀 |
| `cake.svg` | 생일 등 |
| `multi.svg` | 다중 이미지 |

## BE 연동은 나중

- `GET /api/my-ultary`, `GET /api/my-ultary/feeds` 등 BFF는 스켈레톤만 있음 → 우선 목업 데이터로 UI만.
