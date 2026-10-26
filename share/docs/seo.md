# 검색 노출 정책과 SEO

## 노출 범위

사용자 결정(2026-10-26): 로그인 /login, 공개 계정의 울타리 /myultary/{nickname}, 공개 계정의 전체공개 게시글 /feeds/{feedId}만 검색 노출을 허용한다. 비로그인 메인 / 는 기존대로 로그인으로 이동한다. 소개용 메인을 추가하지 않는다.

- Root metadata는 기본 noindex,nofollow다. /signup, /login/password, 설정/검색/DM/스토리/관리자, 울타리 하위 회원 페이지에는 색인 예외를 주지 않는다.
- 로그인/공개 울타리/공유 피드만 index,follow를 지정한다. 공개가 아닌 데이터·삭제·정지·탈퇴·조회 실패는 기본 noindex를 유지한다. SEO는 인증/권한 검사의 대체 수단이 아니다.
- 로그인한 회원의 공개 페이지 metadata는 익명 조회를 수행하지 않는다. 차단된 콘텐츠 정보를 metadata로 우회하지 않으며 회원 화면 제목 설정은 유지한다. 쿠키 없는 검색/공유 크롤러는 기존 게스트 권한으로 조회한다.

## 메타정보와 이미지

- 로그인: Ultary 제목/서비스 설명, canonical /login. signup/error 등 안내 쿼리는 canonical에 넣지 않는다.
- 울타리: 기존 nickname(@펫태그...)님의 울타리 - Ultary 제목과 소개말을 사용한다. 실제 펫 프로필 사진 → 공개 피드 이미지 → 공통 OG 순서로 대표 이미지를 고른다. 목업 프로필 대체 이미지는 대표 이미지에서 제외한다.
- 피드: 작성자님의 게시글 - Ultary 제목, 공개 본문 설명, 첫 미디어의 사진/동영상 썸네일을 사용한다. 대표 사진은 mediaIndex와 무관하다.
- canonical은 /feeds/{id}이며 mediaIndex를 포함하지 않는다. OG/Twitter에도 같은 URL/제목/설명과 대표 이미지를 사용한다. 상대 파일 경로는 기존 게스트 권한 검사를 수행하는 /api/files/{id}/content로 제공한다.
- 로그인/일반 공유 및 대표 사진이 없는 경우 사용자 제공 /images/og-image.png(1731×909)를 사용한다. 공개 울타리/피드는 실제 대표 사진을 우선한다. 이전 생성형 /og route는 제거했다.
- 사용자 제공 /images/favicon.png(1254×1254)를 favicon/shortcut/apple-touch-icon에 연결했다. 기존 Next 기본 favicon.ico는 제거했다. 원본 이미지를 임의 편집하지 않았다.
- 피드 metadata와 게스트 페이지의 조회는 React cache로 같은 렌더 요청 안에서만 중복 제거한다. 비공개 전환에 오래된 공개 캐시를 사용하지 않는다.

## robots와 sitemap

- APP_URL(또는 NEXT_PUBLIC_APP_URL)에 HTTPS 운영 origin이 설정되어야 색인을 연다. 운영 origin이 없거나 localhost/HTTP이면 metadata noindex, robots 전체 차단, 빈 sitemap으로 응답한다. 확정 FE origin은 https://ultary-web.vercel.app이며 실제 .env.production과 예제에 반영했다.
- 운영 robots.txt는 페이지별 noindex를 읽을 수 있도록 페이지 접근을 허용한다. API는 크롤링을 막되 공개 이미지 프록시 /api/files/는 예외다. robots 차단만으로 noindex를 대신하지 않는다.
- sitemap.xml은 /login과 BE의 공개 계정/피드 목록만 포함한다. 삭제·회원 비공개·정지·탈퇴·PRIVATE/NEIGHBORS 게시글은 제외한다. 연결 피드 수가 없는 공개 계정도 공개 울타리가 있으므로 포함한다.
- 서버 전용 GET /api/v1/public/seo/sitemap?type=PROFILE|FEED&cursorId=0&limit=200은 사용자 JWT 없이 기존 BFF 키로 접근한다. 응답은 items([{id,nickname?}]), nextCursorId다. ID 오름차순 커서, limit 1~1000, 다음 페이지 없으면 null. 연락처/본문/비공개 데이터는 응답하지 않는다. Cache-Control:no-store.
- Next sitemap은 커서로 모든 공개 항목을 수집한다. upstream 오류나 잘못된 커서에는 불완전한 목록을 성공으로 내보내지 않고 실패시킨다. 사이트맵 표준의 50,000 URL을 넘으면 명시적으로 실패하므로, 그 규모에 도달하기 전에 shard/index로 확장한다. 현재 포트폴리오 데이터 규모에는 단일 파일을 사용한다.
- DB 변경/migration은 없다. BE sitemap API를 포함한 최신 WAR와 FE 코드를 함께 배포해야 한다.

## 검증 및 배포 후 작업

- FE 137개 회귀(SEO 10개 포함), 변경 소스 lint, 타입 검사, 운영 빌드 통과.
- BE SeoIntegrationTest 6개 + 기존 FeedBlockIntegrationTest 4개 통과. 실제 MariaDB fixture는 롤백하며 worker를 비활성화했다.
- 운영 실행 HTTP 확인: 도메인 미설정 /login·signup·password noindex, robots 전체 차단/빈 sitemap. 검증용 HTTPS origin에서는 /login?signup=complete만 index/canonical=/login, signup/password는 noindex. 기본 OG 이미지를 사용자 제공 파일로 교체했다.
- 실제 공개 피드/울타리의 운영 크롤러 요청은 도메인과 서버 배포 후 확인해야 한다. 단위 테스트의 mock 응답과 실제 검색 엔진 색인 완료를 구분한다.
- 운영 주소 확정 후 로컬 APP_URL/NEXT_PUBLIC_APP_URL을 반영했다. Vercel Production에도 같은 값을 등록·재배포하고, robots.txt/sitemap.xml/공개 페이지 원문/비공개 전환을 운영 주소에서 확인한다.
- 이후 Google Search Console·네이버 서치어드바이저에서 소유권 확인과 sitemap 제출을 진행한다. 실제 검색 결과 반영 시점은 검색 엔진이 결정한다.
- 전체 lint도 후속 정리를 완료했다. 0 errors/0 warnings(--max-warnings=0), FE 회귀 137개 및 운영 빌드 통과.

## CSR/SSR 실제 확인 (2026-10-26)

AI worker를 비활성화한 로컬 BE와 Next dev를 잠시 실행해 실제 공개 데이터를 읽기 전용으로 조회했다. JavaScript를 실행하지 않은 HTML 응답에서 head/script/style을 제거한 본문에도 공개 울타리의 닉네임·소개말과 공유 피드의 작성자·본문이 포함됐다. 메타정보만 SSR이고 내용은 CSR로 비어 있는 구조가 아니다. 로그인 사용자 전용 조회는 CSR일 수 있지만 검색 봇은 쿠키 없는 공개 SSR 경로를 사용한다.

로그인 HTML에 새 favicon·og-image 경로가 포함되고 기존 favicon.ico 링크가 없는 것도 확인했다. 검증용 서버는 종료했다. 실제 검색 순위/색인 및 카카오 미리보기는 운영 도메인 배포 후 별도 확인한다.
