import HashtagRequestEditClient from './HashtagRequestEditClient';

export default async function HashtagRequestEditPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return <HashtagRequestEditClient requestId={requestId} />;
}
