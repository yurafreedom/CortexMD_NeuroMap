import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session?.isAdmin) {
    redirect('/admin/login');
  }
  return <>{children}</>;
}
