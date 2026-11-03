import type { StoryOwner } from '@/types/story';

export function orderMainStoryOwners(owners: StoryOwner[], myUserNo?: number) {
  const priority = (owner: StoryOwner) =>
    owner.userNo === myUserNo && owner.hasUnviewed ? 0 : owner.hasUnviewed ? 1 : 2;
  const time = (owner: StoryOwner) => Date.parse(owner.latestStoryAt ?? '') || 0;
  return [...owners].sort((a, b) => priority(a) - priority(b) || time(b) - time(a));
}
