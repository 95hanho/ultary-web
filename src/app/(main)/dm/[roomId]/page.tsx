import DmClient from '../DmClient';

type PageProps = {
  params: Promise<{ roomId: string }>;
  searchParams?: Promise<{
    feedId?: string;
    feedMediaId?: string;
    storyId?: string;
  }>;
};

function one(value: string | undefined) {
  const text = value?.trim();
  return text || undefined;
}

export default async function DmRoomPage({ params, searchParams }: PageProps) {
  const { roomId } = await params;
  const query = searchParams ? await searchParams : undefined;
  return (
    <DmClient
      roomId={roomId}
      feedId={one(query?.feedId)}
      feedMediaId={one(query?.feedMediaId)}
      storyId={one(query?.storyId)}
    />
  );
}
