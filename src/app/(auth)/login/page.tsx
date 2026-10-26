import { publicPageMetadata, SITE_DESCRIPTION } from '@/lib/seo/metadata';
import { SEO_ORIGIN } from '@/lib/seo/site';
export const metadata = publicPageMetadata({
  origin: SEO_ORIGIN,
  path: '/login',
  title: 'Ultary',
  description: SITE_DESCRIPTION,
});
import LoginClient from './LoginClient';

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; signup?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  return (
    <LoginClient initialError={params?.error} signupComplete={params?.signup === 'complete'} />
  );
}
