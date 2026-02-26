import { redirect } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/auth';
import SecretList from '@/components/SecretList';

export default async function SecretsPage() {
  const session = await getSessionFromCookie();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  return <SecretList />;
}
