import StoriesClient from './StoriesClient';

type PageProps = {
  searchParams?: Promise<{
    userNo?: string;
    nickname?: string;
    /** unviewed(기본) | last — 이웃 체인에서 이전 이웃으로 올 때 last */
    start?: string;
  }>;
};

export default async function StoriesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const userNo = params?.userNo?.trim() || '';
  const nickname = params?.nickname?.trim() || '';
  const start = params?.start?.trim() === 'last' ? 'last' : 'unviewed';

  return (
    <StoriesClient userNo={userNo} nicknameHint={nickname} start={start} />
  );
}
