# Agent 명령 — 마이울타리 UI

> 회사/집에서 Cursor Agent에 붙여넣어 사용.

---

## 다음에 할 일 (UI 구현)

아래 **첨부 목업 이미지(좌: 펫 슬라이드 / 우: 펫 상세)** 대로
`src/app/(main)/my-ultary/` UI를 만들어줘.

이미 되어 있는 것:

- `page.tsx`(서버) + `MyUltaryClient.tsx`(`'use client'`) 분리
- `/my-ultary`에서 **에셋 확인용 나열**만 되어 있음 → 이걸 실제 UI로 교체

너가 해준 거 디테일은 내가 수정할게. BE 연동은 나중(목업 데이터로 UI만).

---

## UI 동작 규칙

### 공통

- 자기 계정일 때만:
  - 소개글 옆 **연필(`Edit.svg`)** 표시
  - pet 사진 위 **톱니(`Setting_fill.svg`)** 표시
- 하단 메뉴는 `FooterMenu` 사용하되, **마이울타리 버튼은 `Profile.tsx`와 다름**
  - Footer 5번째는 스토리 링이 아니라 **현재 페이지 on/off(테두리 등)** 만 표시
  - → Footer용 아바타를 **별도 컴포넌트/분기**로 분리할 것

### 우측 세로 버튼 (위 → 아래)

| # | 아이콘 | 의미 |
|---|--------|------|
| 1 | `Book_open_alt-*` | **계정 스토리** (pet이 여러 마리여도 계정당 스토리 버튼은 **하나**) |
| 2 | `Order` / `Order_on` | 목록/피드 탭 |
| 3 | `Group_light` / `Group_light_on` | 주민/그룹 탭 |
| 4 | `Pin` / `Pin_on` | 저장/핀 탭 |

**스토리 버튼(맨 위) 상태**

- 스토리 **있음(미읽음)** → 초록색 + on 아이콘 (`Book_open_alt-on.svg`) — 목업 왼쪽
- 스토리 **없음** → off 아이콘/색 (`Book_open_alt-off.svg`) — 목업 오른쪽
- 스토리 **읽음** → 색상·아이콘 **추가 업로드 필요** (아직 없음). 구현 시 placeholder 두고 TODO 표시

### 펫 영역 (같은 페이지, 두 상태)

좌·우 목업은 **같은 페이지의 두 UI 상태**.

1. **슬라이드 뷰 (왼쪽)**  
   - pet이 특정 개수보다 많으면 가로 이미지 슬라이드(+ 좌우 `arrow_*` 버튼)
2. **상세 뷰 (오른쪽)**  
   - 슬라이드에서 pet **클릭** → 상단 썸네일 줄 + 아래 선택 pet 정보 카드
   - 상세에서 **현재 선택된 pet을 다시 클릭** → 다시 슬라이드 뷰로 복귀
   - 상세에서 **다른 pet 클릭** → 그 pet 정보로 교체

---

## 아이콘 / 이미지 맵 (확정)

경로 기본: `/images/icon/...` · 목업: `/images/mock/`

### 헤더

| 파일 | 용도 |
|------|------|
| `ultary_logo.png` | 로고 |
| `Add_round.svg` | 글쓰기/추가 `+` |
| `Setting_line.svg` | 설정 |

### 프로필 / 소개 / 생일

| 파일 | 용도 |
|------|------|
| `Edit.svg` | 소개글 수정 (본인만) |
| `cake.svg` | 생일 배지/문구 |

### 펫

| 파일 | 용도 |
|------|------|
| `arrow_left.svg` / `arrow_right.svg` | 펫 슬라이드 이전/다음 |
| `Setting_fill.svg` | pet 설정 (본인만) |

### 우측 세로 탭 (on/off)

| off | on | 용도 |
|-----|-----|------|
| `Book_open_alt-off.svg` | `Book_open_alt-on.svg` | 계정 스토리 (읽음용 추가 예정) |
| `Order.svg` | `Order_on.svg` | 목록/피드 |
| `Group_light.svg` | `Group_light_on.svg` | 주민/그룹 |
| `Pin.svg` | `Pin_on.svg` | 저장/핀 |

### 피드 그리드

| 파일 | 용도 |
|------|------|
| `multi.svg` | 다중 이미지 게시물 표시 |

### Footer (on/off) — `FooterMenu`

| off | on | 용도 |
|-----|-----|------|
| `Home.svg` | `Home_fill.svg` | 홈 |
| `Search.svg` | `Search_fill.svg` | 검색 |
| `Bell.svg` | `Bell_fill.svg` | 알림 |
| `Message.svg` | `Message_fill.svg` | 메시지 |
| (썸네일) | (썸네일+활성 테두리) | 마이울타리 — **Profile.tsx 아님**, Footer 전용 |

### 배경 / 목업

| 파일 | 용도 |
|------|------|
| `/images/ultary_bg_bt.png` | 하단 울타리 배경 |
| `/images/mock/profile.jpg` | 프로필/펫 목업 |
| `/images/mock/post_ex.jpg` | 피드 그리드 목업 |
| `/images/mock/feed.jpg` | 피드 목업 후보 |

### 아직 없음 (추후 업로드)

- 스토리 **읽음**용 `Book_open_alt` 색상/아이콘

---

## 참고 (프로젝트 컨벤션)

- 페이지: `page.tsx` (서버) + `MyUltaryClient.tsx` (`'use client'`)
- SCSS module: 페이지 `my-ultary.module.scss`(소문자), 컴포넌트 `PascalCase.module.scss`
- 공통 프로필(스토리 링): `src/components/my-ultary/Profile.tsx` — `size`, `story` (`none` | `read` | `unread`)
  - 피드·스토리 아바타용. **Footer 마이울타리 버튼에는 쓰지 말 것**
- 아이콘 경로: `/images/icon/...`
- 목업 이미지: `public/images/mock/`

## BE 연동은 나중

- `GET /api/my-ultary`, `GET /api/my-ultary/feeds` 등 BFF는 스켈레톤만 있음 → 우선 목업 데이터로 UI만.
