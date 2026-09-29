import MyUltaryClient from '../MyUltaryClient';

type PageProps = {
  params: Promise<{ nickname: string }>;
};

export default async function MyUltaryNicknamePage({ params }: PageProps) {
  const { nickname } = await params;
  const decoded = decodeURIComponent(nickname);
  return <MyUltaryClient nickname={decoded} />;
}
