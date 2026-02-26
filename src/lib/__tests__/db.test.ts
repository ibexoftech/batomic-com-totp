import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('database', () => {
  let db: Database.Database;
  let dbPath: string;

  beforeEach(() => {
    // Encryption requires a file-based database
    dbPath = path.join(os.tmpdir(), `totp-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
    db = new Database(dbPath);
    db.pragma(`cipher='chacha20'`);
    db.pragma(`key='${'a'.repeat(64)}'`);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE secrets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        issuer TEXT NOT NULL DEFAULT '',
        encrypted_secret BLOB NOT NULL,
        iv BLOB NOT NULL,
        auth_tag BLOB NOT NULL,
        algorithm TEXT NOT NULL DEFAULT 'SHA1',
        digits INTEGER NOT NULL DEFAULT 6,
        period INTEGER NOT NULL DEFAULT 30,
        added_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        secret_id INTEGER,
        ip_address TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  });

  afterEach(() => {
    db.close();
    try { fs.unlinkSync(dbPath); } catch {}
    try { fs.unlinkSync(dbPath + '-wal'); } catch {}
    try { fs.unlinkSync(dbPath + '-shm'); } catch {}
  });

  it('creates tables and inserts a user', () => {
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('test', 'hash', 'admin');
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('test') as Record<string, unknown>;
    expect(user).toBeDefined();
    expect(user.username).toBe('test');
    expect(user.role).toBe('admin');
  });

  it('enforces unique username constraint', () => {
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('test', 'hash');
    expect(() =>
      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('test', 'hash2')
    ).toThrow();
  });

  it('stores and retrieves binary blobs', () => {
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('test', 'hash');
    const enc = Buffer.from([1, 2, 3, 4]);
    const iv = Buffer.from([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const tag = Buffer.from([17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);

    db.prepare(
      'INSERT INTO secrets (label, encrypted_secret, iv, auth_tag, added_by) VALUES (?, ?, ?, ?, ?)'
    ).run('test', enc, iv, tag, 1);

    const row = db.prepare('SELECT * FROM secrets WHERE label = ?').get('test') as Record<string, unknown>;
    expect(Buffer.from(row.encrypted_secret as Buffer)).toEqual(enc);
    expect(Buffer.from(row.iv as Buffer)).toEqual(iv);
    expect(Buffer.from(row.auth_tag as Buffer)).toEqual(tag);
  });

  it('inserts audit log entries', () => {
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('test', 'hash');
    db.prepare('INSERT INTO audit_log (user_id, action, ip_address) VALUES (?, ?, ?)').run(1, 'login', '127.0.0.1');

    const entry = db.prepare('SELECT * FROM audit_log WHERE user_id = ?').get(1) as Record<string, unknown>;
    expect(entry.action).toBe('login');
    expect(entry.ip_address).toBe('127.0.0.1');
  });

  it('is unreadable without encryption key', () => {
    db.close();
    const db2 = new Database(dbPath, { readonly: true });
    expect(() => db2.prepare('SELECT * FROM users').all()).toThrow();
    db2.close();
    // Re-open for afterEach cleanup
    db = new Database(dbPath);
    db.pragma(`cipher='chacha20'`);
    db.pragma(`key='${'a'.repeat(64)}'`);
  });
});
