import { getDb, closeDb } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth';

async function seed() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('ADMIN_PASSWORD must be set in .env.local');
    process.exit(1);
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    console.log(`User "${username}" already exists, skipping.`);
    closeDb();
    return;
  }

  const passwordHash = await hashPassword(password);
  db.prepare(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
  ).run(username, passwordHash, 'admin');

  console.log(`Admin user "${username}" created successfully.`);
  closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
