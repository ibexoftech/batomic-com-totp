'use client';

import { useState, useEffect } from 'react';

interface SecretInfo {
  id: number;
  label: string;
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
  created_at: string;
}

export default function SecretList() {
  const [secrets, setSecrets] = useState<SecretInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSecrets();
  }, []);

  async function fetchSecrets() {
    try {
      const res = await fetch('/api/secrets');
      if (!res.ok) throw new Error('Failed to fetch');
      setSecrets(await res.json());
    } catch {
      setError('Failed to load secrets');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, label: string) {
    if (!confirm(`Delete secret "${label}"?`)) return;

    try {
      const res = await fetch(`/api/secrets/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Delete failed');
        return;
      }
      setSecrets((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Network error');
    }
  }

  if (loading) return <div style={styles.muted}>Loading secrets...</div>;

  return (
    <div>
      <h2 style={styles.heading}>Manage Secrets</h2>
      {error && <div style={styles.error}>{error}</div>}

      {secrets.length === 0 ? (
        <div style={styles.muted}>No secrets yet.</div>
      ) : (
        <div style={styles.table}>
          <div style={styles.headerRow}>
            <span style={styles.cell}>Issuer</span>
            <span style={styles.cell}>Label</span>
            <span style={styles.cell}>Config</span>
            <span style={styles.cellSmall}>Actions</span>
          </div>
          {secrets.map((s) => (
            <div key={s.id} style={styles.row}>
              <span style={styles.cell}>{s.issuer || '—'}</span>
              <span style={styles.cell}>{s.label}</span>
              <span style={{ ...styles.cell, ...styles.muted }}>
                {s.algorithm} / {s.digits}d / {s.period}s
              </span>
              <span style={styles.cellSmall}>
                <button onClick={() => handleDelete(s.id, s.label)} style={styles.deleteBtn}>
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' },
  table: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  headerRow: {
    display: 'flex',
    padding: '0.75rem 1rem',
    background: 'var(--bg-secondary)',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border)',
  },
  row: {
    display: 'flex',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    borderBottom: '1px solid var(--border)',
    alignItems: 'center',
  },
  cell: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  cellSmall: { width: '80px', flexShrink: 0, textAlign: 'right' as const },
  deleteBtn: {
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  error: {
    padding: '0.625rem 0.75rem',
    borderRadius: 'var(--radius)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  muted: { color: 'var(--text-secondary)', fontSize: '0.875rem' },
};
