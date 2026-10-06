import PostClient from './PostClient';

type PageProps = {
  searchParams?: Promise<{ mediaIndex?: string; feedMediaId?: string }>;
};

export default async function PostPage({ searchParams }: PageProps) {
  const query = searchParams ? await searchParams : undefined;
  const raw = Number(query?.mediaIndex);
  const mediaIndex = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  return <PostClient mediaIndex={mediaIndex} feedMediaId={query?.feedMediaId?.trim() || ''} />;
}
