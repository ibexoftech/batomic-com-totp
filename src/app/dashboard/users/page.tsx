import { redirect } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/auth';
import UserManager from '@/components/UserManager';

export default async function UsersPage() {
  const session = await getSessionFromCookie();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  return <UserManager />;
}
