import DmClient from './DmClient';

type PageProps = {
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

export default async function DmPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : undefined;
  return (
    <DmClient
      feedId={one(query?.feedId)}
      feedMediaId={one(query?.feedMediaId)}
      storyId={one(query?.storyId)}
    />
  );
}
