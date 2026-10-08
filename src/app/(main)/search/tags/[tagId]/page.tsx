import TagGridClient from './TagGridClient';

type PageProps = {
  params: Promise<{ tagId: string }>;
};

export default async function SearchTagPage({ params }: PageProps) {
  const { tagId } = await params;
  return <TagGridClient tagId={tagId} />;
}
