'use client';

import { useState, useEffect, useCallback } from 'react';

interface SecretInfo {
  id: number;
  label: string;
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
  created_at: string;
  firebase_enabled: number;
  firebase_url: string;
  firebase_api_key: string;
  firebase_token_target: string;
}

interface PushStatus {
  lastCode: string | null;
  lastPushAt: string | null;
  lastError: string | null;
}

interface FirebaseForm {
  firebase_enabled: boolean;
  firebase_url: string;
  firebase_api_key: string;
  firebase_token_target: string;
}

export default function SecretList() {
  const [secrets, setSecrets] = useState<SecretInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [firebaseForm, setFirebaseForm] = useState<FirebaseForm>({
    firebase_enabled: false,
    firebase_url: '',
    firebase_api_key: '',
    firebase_token_target: '',
  });
  const [saving, setSaving] = useState(false);
  const [pushStatuses, setPushStatuses] = useState<Record<number, PushStatus>>({});

  const fetchSecrets = useCallback(async () => {
    try {
      const res = await fetch('/api/secrets');
      if (!res.ok) throw new Error('Failed to fetch');
      setSecrets(await res.json());
    } catch {
      setError('Failed to load secrets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  useEffect(() => {
    const hasFirebaseEnabled = secrets.some((s) => s.firebase_enabled);
    if (!hasFirebaseEnabled) return;

    async function fetchStatuses() {
      try {
        const res = await fetch('/api/secrets/push-status');
        if (res.ok) setPushStatuses(await res.json());
      } catch {
        // silently ignore
      }
    }

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [secrets]);

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
      if (expandedId === id) setExpandedId(null);
    } catch {
      setError('Network error');
    }
  }

  function handleConfigure(secret: SecretInfo) {
    if (expandedId === secret.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(secret.id);
    setFirebaseForm({
      firebase_enabled: secret.firebase_enabled === 1,
      firebase_url: secret.firebase_url,
      firebase_api_key: secret.firebase_api_key,
      firebase_token_target: secret.firebase_token_target,
    });
  }

  async function handleSaveFirebase(id: number) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/secrets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_enabled: firebaseForm.firebase_enabled ? 1 : 0,
          firebase_url: firebaseForm.firebase_url,
          firebase_api_key: firebaseForm.firebase_api_key,
          firebase_token_target: firebaseForm.firebase_token_target,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Save failed');
        return;
      }
      setSecrets((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                firebase_enabled: firebaseForm.firebase_enabled ? 1 : 0,
                firebase_url: firebaseForm.firebase_url,
                firebase_api_key: firebaseForm.firebase_api_key,
                firebase_token_target: firebaseForm.firebase_token_target,
              }
            : s
        )
      );
      setExpandedId(null);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  function getFirebaseStatus(secret: SecretInfo): { label: string; color: string } {
    if (!secret.firebase_enabled) return { label: 'Off', color: 'var(--text-secondary)' };
    const status = pushStatuses[secret.id];
    if (status?.lastError) return { label: 'Error', color: 'var(--danger)' };
    if (status?.lastPushAt) return { label: 'Pushing', color: '#22c55e' };
    return { label: 'Pending', color: '#eab308' };
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
            <span style={styles.cellMed}>Firebase</span>
            <span style={styles.cellSmall}>Actions</span>
          </div>
          {secrets.map((s) => {
            const fbStatus = getFirebaseStatus(s);
            return (
              <div key={s.id}>
                <div style={styles.row}>
                  <span style={styles.cell}>{s.issuer || '—'}</span>
                  <span style={styles.cell}>{s.label}</span>
                  <span style={{ ...styles.cell, ...styles.muted }}>
                    {s.algorithm} / {s.digits}d / {s.period}s
                  </span>
                  <span style={styles.cellMed}>
                    <span style={{ color: fbStatus.color, fontSize: '0.8rem', fontWeight: 600 }}>
                      {fbStatus.label}
                    </span>
                  </span>
                  <span style={styles.cellSmall}>
                    <button onClick={() => handleConfigure(s)} style={styles.configBtn}>
                      {expandedId === s.id ? 'Close' : 'Config'}
                    </button>
                    <button onClick={() => handleDelete(s.id, s.label)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </span>
                </div>
                {expandedId === s.id && (
                  <div style={styles.expandedRow}>
                    <div style={styles.formGrid}>
                      <label style={styles.formLabel}>
                        <input
                          type="checkbox"
                          checked={firebaseForm.firebase_enabled}
                          onChange={(e) =>
                            setFirebaseForm((f) => ({ ...f, firebase_enabled: e.target.checked }))
                          }
                        />
                        <span style={{ marginLeft: '0.5rem' }}>Enable Firebase Push</span>
                      </label>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Firebase URL</span>
                        <input
                          type="text"
                          placeholder="https://your-project.firebaseio.com"
                          value={firebaseForm.firebase_url}
                          onChange={(e) =>
                            setFirebaseForm((f) => ({ ...f, firebase_url: e.target.value }))
                          }
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>API Key</span>
                        <input
                          type="password"
                          placeholder="Firebase database secret"
                          value={firebaseForm.firebase_api_key}
                          onChange={(e) =>
                            setFirebaseForm((f) => ({ ...f, firebase_api_key: e.target.value }))
                          }
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.fieldGroup}>
                        <span style={styles.fieldLabel}>Token Target</span>
                        <input
                          type="text"
                          placeholder="e.g. my-service"
                          value={firebaseForm.firebase_token_target}
                          onChange={(e) =>
                            setFirebaseForm((f) => ({
                              ...f,
                              firebase_token_target: e.target.value,
                            }))
                          }
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <button
                          onClick={() => handleSaveFirebase(s.id)}
                          disabled={saving}
                          style={styles.saveBtn}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      {pushStatuses[s.id]?.lastError && (
                        <div style={styles.pushError}>
                          Last error: {pushStatuses[s.id].lastError}
                        </div>
                      )}
                      {pushStatuses[s.id]?.lastPushAt && (
                        <div style={styles.pushInfo}>
                          Last push: {pushStatuses[s.id].lastPushAt}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
  cellMed: { width: '90px', flexShrink: 0, textAlign: 'center' as const },
  cellSmall: { width: '130px', flexShrink: 0, textAlign: 'right' as const, display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' },
  configBtn: {
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--accent)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  expandedRow: {
    padding: '1rem',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    maxWidth: '500px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  fieldLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  input: {
    padding: '0.5rem 0.625rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '0.85rem',
  },
  saveBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  pushError: {
    fontSize: '0.8rem',
    color: 'var(--danger)',
  },
  pushInfo: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
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
