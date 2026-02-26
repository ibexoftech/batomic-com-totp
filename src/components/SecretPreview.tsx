'use client';

interface SecretPreviewProps {
  label: string;
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export default function SecretPreview({
  label, issuer, algorithm, digits, period, onSave, onCancel, saving,
}: SecretPreviewProps) {
  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Preview</h3>
      <div style={styles.grid}>
        <Detail label="Label" value={label} />
        <Detail label="Issuer" value={issuer || '(none)'} />
        <Detail label="Algorithm" value={algorithm} />
        <Detail label="Digits" value={String(digits)} />
        <Detail label="Period" value={`${period}s`} />
      </div>
      <div style={styles.actions}>
        <button onClick={onCancel} style={styles.cancelBtn} disabled={saving}>Cancel</button>
        <button onClick={onSave} style={styles.saveBtn} disabled={saving}>
          {saving ? 'Saving...' : 'Save Secret'}
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={styles.detailLabel}>{label}</div>
      <div style={styles.detailValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
  },
  heading: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  detailLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.125rem',
  },
  detailValue: {
    fontSize: '0.875rem',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  saveBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
};
