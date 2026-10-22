/** 회원 페이지 경로. 새 페이지 추가 시 함께 갱신하며 테스트에서 실제 라우트와 비교한다. */
export const MEMBER_PAGE_PATHS = [
  "/",
  "/dm",
  "/dm/[roomId]",
  "/feeds/[feedId]",
  "/myultary",
  "/myultary/[nickname]",
  "/myultary/[nickname]/neighbors",
  "/myultary/[nickname]/pets/[petId]/photo",
  "/myultary/[nickname]/pinned/[id]",
  "/myultary/[nickname]/posts/[id]",
  "/myultary/[nickname]/profile",
  "/myultary/[nickname]/residents",
  "/myultary/[nickname]/saved/[id]",
  "/myultary/[nickname]/tagged",
  "/myultary/[nickname]/tagged/[id]",
  "/myultary/[nickname]/write",
  "/myultary/[nickname]/write/compose",
  "/myultary/[nickname]/write/crop",
  "/myultary/[nickname]/write/tags",
  "/notifications",
  "/posts/[id]",
  "/search",
  "/search/tags/[tagId]",
  "/settings",
  "/settings/activity",
  "/settings/blocked",
  "/settings/hashtags",
  "/settings/hashtags/crop",
  "/settings/hashtags/new",
  "/settings/mypage",
  "/settings/mypage/edit",
  "/settings/mypage/password",
  "/settings/notifications",
  "/settings/pets",
  "/settings/privacy",
  "/settings/saved",
  "/settings/support",
  "/settings/terms",
  "/settings/withdraw",
  "/stories",
  "/stories/[storyId]",
  "/stories/up",
  "/stories/up/crop"
] as const;

export function isMemberPagePath(pathname: string): boolean {
  const parts = pathname.replace(/\/$/, '').split('/');
  return MEMBER_PAGE_PATHS.some(route => {
    const pattern = route.replace(/\/$/, '').split('/');
    return pattern.length === parts.length && pattern.every((part, i) =>
      part.startsWith('[') ? Boolean(parts[i]) : part === parts[i]);
  });
}
