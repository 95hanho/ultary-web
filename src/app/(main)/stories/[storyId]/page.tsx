import StoriesClient from '../StoriesClient';

type PageProps = {
  params: Promise<{ storyId: string }>;
  searchParams?: Promise<{ userNo?: string; nickname?: string }>;
};

/** 알림에서 들어오는 스토리 한 장. userNo가 없으면 내 스토리에서 찾는다. */
export default async function StoryOnePage({ params, searchParams }: PageProps) {
  const { storyId } = await params;
  const query = searchParams ? await searchParams : undefined;

  return (
    <StoriesClient
      userNo={query?.userNo?.trim() || ''}
      nicknameHint={query?.nickname?.trim() || ''}
      singleUser
      onlyStoryId={storyId}
    />
  );
}
