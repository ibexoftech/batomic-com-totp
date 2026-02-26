export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'viewer';
  created_at: string;
}

export interface Secret {
  id: number;
  label: string;
  issuer: string;
  encrypted_secret: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  algorithm: string;
  digits: number;
  period: number;
  added_by: number;
  created_at: string;
}

export interface TotpCode {
  id: number;
  label: string;
  issuer: string;
  code: string;
  remaining: number;
  period: number;
}

export interface AuditEntry {
  id: number;
  user_id: number;
  username?: string;
  action: string;
  secret_id: number | null;
  ip_address: string;
  timestamp: string;
}

export interface SessionPayload {
  userId: number;
  username: string;
  role: 'admin' | 'viewer';
  exp: number;
}
