import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../auth';
import { createSessionToken, verifySessionToken } from '../session';

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).toContain(':');
    const valid = await verifyPassword('mypassword', hash);
    expect(valid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('mypassword');
    const valid = await verifyPassword('wrongpassword', hash);
    expect(valid).toBe(false);
  });

  it('produces different hashes for same password (random salt)', async () => {
    const a = await hashPassword('mypassword');
    const b = await hashPassword('mypassword');
    expect(a).not.toBe(b);
  });
});

describe('session tokens', () => {
  it('creates and verifies a session token', async () => {
    const token = await createSessionToken({
      userId: 1,
      username: 'admin',
      role: 'admin',
    });
    expect(token).toContain('.');

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe(1);
    expect(payload!.username).toBe('admin');
    expect(payload!.role).toBe('admin');
    expect(payload!.exp).toBeGreaterThan(Date.now());
  });

  it('rejects a tampered token', async () => {
    const token = await createSessionToken({
      userId: 1,
      username: 'admin',
      role: 'admin',
    });
    const tampered = token.slice(0, -1) + 'x';
    const payload = await verifySessionToken(tampered);
    expect(payload).toBeNull();
  });

  it('rejects a token with wrong secret', async () => {
    const token = await createSessionToken({
      userId: 1,
      username: 'admin',
      role: 'admin',
    });
    const origSecret = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = 'f'.repeat(64);
    const payload = await verifySessionToken(token);
    expect(payload).toBeNull();
    process.env.SESSION_SECRET = origSecret;
  });
});
