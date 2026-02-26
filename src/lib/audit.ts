import { getDb } from './db';

export function logAudit(
  userId: number | null,
  action: string,
  secretId: number | null,
  ipAddress: string,
): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO audit_log (user_id, action, secret_id, ip_address) VALUES (?, ?, ?, ?)'
  ).run(userId, action, secretId, ipAddress);
}
