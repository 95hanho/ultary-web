import AdminShell from '../AdminShell';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
