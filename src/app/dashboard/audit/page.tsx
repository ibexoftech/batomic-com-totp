import { redirect } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/auth';
import AuditTable from '@/components/AuditTable';

export default async function AuditPage() {
  const session = await getSessionFromCookie();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  return <AuditTable />;
}
