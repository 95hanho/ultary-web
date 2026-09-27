import StoriesClient from './StoriesClient';

type PageProps = {
  searchParams?: Promise<{
    userNo?: string;
    nickname?: string;
    /** unviewed(기본) | last — 이웃 체인에서 이전 이웃으로 올 때 last */
    start?: string;
    /** unread: 클릭한 유저 이후의 안 읽은 유저만 이어서 재생 */
    chain?: string;
    /** chain=unread 일 때 메인에서 누른 유저 */
    from?: string;
    /** 1: 이 유저 스토리만. 첫 장 이전·마지막 다음은 이전 페이지 */
    single?: string;
  }>;
};

export default async function StoriesPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const userNo = params?.userNo?.trim() || '';
  const nickname = params?.nickname?.trim() || '';
  const start = params?.start?.trim() === 'last' ? 'last' : 'unviewed';
  const unreadChain = params?.chain?.trim() === 'unread';
  const fromUserNo = params?.from?.trim() || (unreadChain ? userNo : '');
  const singleUser = params?.single?.trim() === '1';

  return (
    <StoriesClient
      userNo={userNo}
      nicknameHint={nickname}
      start={start}
      unreadChain={unreadChain}
      fromUserNo={fromUserNo}
      singleUser={singleUser}
    />
  );
}
