'use client';

import { useState, useEffect } from 'react';
import type { AuditEntry } from '@/types';

export default function AuditTable() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [page, actionFilter]);

  async function fetchEntries() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (actionFilter) params.set('action', actionFilter);

      const res = await fetch(`/api/audit?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEntries(data.entries);
      setTotalPages(data.pages);
    } catch {
      setError('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }

  const actions = ['login', 'login_failed', 'logout', 'secret_added', 'secret_deleted', 'user_created', 'user_deleted'];

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Audit Log</h2>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          style={styles.filter}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.muted}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={styles.muted}>No audit entries.</div>
      ) : (
        <>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={styles.cellWide}>Timestamp</span>
              <span style={styles.cell}>User</span>
              <span style={styles.cell}>Action</span>
              <span style={styles.cell}>IP</span>
            </div>
            {entries.map((e) => (
              <div key={e.id} style={styles.row}>
                <span style={{ ...styles.cellWide, ...styles.muted }}>
                  {new Date(e.timestamp + 'Z').toLocaleString()}
                </span>
                <span style={styles.cell}>{e.username || '—'}</span>
                <span style={styles.cell}>
                  <span style={{
                    ...styles.badge,
                    background: e.action.includes('fail') ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
                    color: e.action.includes('fail') ? 'var(--danger)' : 'var(--text-secondary)',
                  }}>
                    {e.action}
                  </span>
                </span>
                <span style={{ ...styles.cell, ...styles.muted }}>{e.ip_address}</span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={styles.pageBtn}
              >
                Previous
              </button>
              <span style={styles.muted}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={styles.pageBtn}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' as const, gap: '0.5rem' },
  heading: { fontSize: '1.25rem', fontWeight: 700 },
  filter: {
    padding: '0.375rem 0.75rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem',
  },
  table: { border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  tableHeader: {
    display: 'flex', padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid var(--border)',
  },
  row: {
    display: 'flex', padding: '0.625rem 1rem', fontSize: '0.8rem',
    borderBottom: '1px solid var(--border)', alignItems: 'center',
  },
  cell: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  cellWide: { flex: 1.5, minWidth: 0 },
  badge: { padding: '0.125rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' },
  pageBtn: {
    padding: '0.375rem 0.75rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: '0.8rem', cursor: 'pointer',
  },
  error: {
    padding: '0.625rem 0.75rem', borderRadius: 'var(--radius)',
    background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem',
  },
  muted: { color: 'var(--text-secondary)', fontSize: '0.8rem' },
};
