import { redirect } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/auth';
import AddSecretForm from '@/components/AddSecretForm';

export default async function AddSecretPage() {
  const session = await getSessionFromCookie();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  return <AddSecretForm />;
}
