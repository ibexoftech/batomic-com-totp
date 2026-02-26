'use client';

import { useState, useEffect } from 'react';

interface UserInfo {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export default function UserManager() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch');
      setUsers(await res.json());
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newUsername || !newPassword) {
      setError('Username and password required');
      return;
    }
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Create failed');
        return;
      }
      const created = await res.json();
      setUsers((prev) => [...prev, { ...created, created_at: new Date().toISOString() }]);
      setNewUsername('');
      setNewPassword('');
      setNewRole('viewer');
      setShowForm(false);
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number, username: string) {
    if (!confirm(`Delete user "${username}"?`)) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Delete failed');
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError('Network error');
    }
  }

  if (loading) return <div style={styles.muted}>Loading users...</div>;

  return (
    <div>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>Manage Users</h2>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={styles.input}
          />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={styles.input}>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleCreate} disabled={creating} style={styles.createBtn}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span style={styles.cell}>Username</span>
          <span style={styles.cell}>Role</span>
          <span style={styles.cell}>Created</span>
          <span style={styles.cellSmall}>Actions</span>
        </div>
        {users.map((u) => (
          <div key={u.id} style={styles.tableRow}>
            <span style={styles.cell}>{u.username}</span>
            <span style={styles.cell}>
              <span style={{
                ...styles.badge,
                background: u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)',
                color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-secondary)',
              }}>
                {u.role}
              </span>
            </span>
            <span style={{ ...styles.cell, ...styles.muted }}>
              {new Date(u.created_at).toLocaleDateString()}
            </span>
            <span style={styles.cellSmall}>
              <button onClick={() => handleDelete(u.id, u.username)} style={styles.deleteBtn}>
                Delete
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading: { fontSize: '1.25rem', fontWeight: 700 },
  addBtn: {
    padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: 'none',
    background: 'var(--accent)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  },
  form: {
    display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' as const,
  },
  input: {
    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem',
  },
  createBtn: {
    padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: 'none',
    background: 'var(--success)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  },
  table: { border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  tableHeader: {
    display: 'flex', padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid var(--border)',
  },
  tableRow: {
    display: 'flex', padding: '0.75rem 1rem', fontSize: '0.875rem',
    borderBottom: '1px solid var(--border)', alignItems: 'center',
  },
  cell: { flex: 1, minWidth: 0 },
  cellSmall: { width: '80px', flexShrink: 0, textAlign: 'right' as const },
  badge: {
    padding: '0.125rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
  },
  deleteBtn: {
    padding: '0.25rem 0.5rem', borderRadius: 'var(--radius)', border: 'none',
    background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer',
  },
  error: {
    padding: '0.625rem 0.75rem', borderRadius: 'var(--radius)',
    background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem',
  },
  muted: { color: 'var(--text-secondary)', fontSize: '0.8rem' },
};
