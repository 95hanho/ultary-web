import LoginClient from './LoginClient';

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; signup?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  return <LoginClient initialError={params?.error} signupComplete={params?.signup === 'complete'} />;
}
