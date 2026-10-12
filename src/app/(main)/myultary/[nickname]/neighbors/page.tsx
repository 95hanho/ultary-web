import RelationListClient from '../relations/RelationListClient';

type PageProps = {
  searchParams?: Promise<{ userNo?: string }>;
};

/** 울타리 팔로워 목록 */
export default async function NeighborsPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : undefined;
  return <RelationListClient userNo={query?.userNo?.trim() || ''} kind="neighbors" />;
}
