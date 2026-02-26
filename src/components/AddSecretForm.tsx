'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import SecretPreview from './SecretPreview';

const QrScanner = dynamic(() => import('./QrScanner'), { ssr: false });

type Mode = 'uri' | 'manual';

interface ParsedSecret {
  label: string;
  issuer: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
}

export default function AddSecretForm() {
  const [mode, setMode] = useState<Mode>('uri');
  const [uri, setUri] = useState('');
  const [label, setLabel] = useState('');
  const [issuer, setIssuer] = useState('');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA1');
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [preview, setPreview] = useState<ParsedSecret | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleQrScan(scannedUri: string) {
    setUri(scannedUri);
    handleUriParse(scannedUri);
  }

  function handleUriParse(uriToParse?: string) {
    setError('');
    const value = uriToParse || uri;
    if (!value.startsWith('otpauth://')) {
      setError('URI must start with otpauth://');
      return;
    }

    // Send to server to parse
    fetch('/api/secrets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: value, dryRun: true }),
    });

    // Simple client-side parse for preview
    try {
      const url = new URL(value);
      const parsedLabel = decodeURIComponent(url.pathname.slice(1).replace(/^totp\//, ''));
      const parsedIssuer = url.searchParams.get('issuer') || '';
      const parsedSecret = url.searchParams.get('secret') || '';
      const parsedAlgorithm = url.searchParams.get('algorithm') || 'SHA1';
      const parsedDigits = parseInt(url.searchParams.get('digits') || '6');
      const parsedPeriod = parseInt(url.searchParams.get('period') || '30');

      if (!parsedSecret) {
        setError('No secret found in URI');
        return;
      }

      setPreview({
        label: parsedLabel,
        issuer: parsedIssuer,
        secret: parsedSecret,
        algorithm: parsedAlgorithm,
        digits: parsedDigits,
        period: parsedPeriod,
      });
    } catch {
      setError('Could not parse URI');
    }
  }

  function handleManualPreview() {
    setError('');
    if (!label || !secret) {
      setError('Label and secret are required');
      return;
    }
    setPreview({ label, issuer, secret, algorithm, digits, period });
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    setError('');

    try {
      const body = mode === 'uri' && uri
        ? { uri }
        : {
            label: preview.label,
            issuer: preview.issuer,
            secret: preview.secret,
            algorithm: preview.algorithm,
            digits: preview.digits,
            period: preview.period,
          };

      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      setSuccess(`Secret "${preview.label}" added successfully!`);
      setPreview(null);
      setUri('');
      setLabel('');
      setIssuer('');
      setSecret('');
      setAlgorithm('SHA1');
      setDigits(6);
      setPeriod(30);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Add Secret</h2>

      {success && (
        <div style={styles.success}>
          {success}
          <a href="/dashboard" style={styles.dashLink}>View Dashboard</a>
        </div>
      )}
      {error && <div style={styles.error}>{error}</div>}

      {/* Mode tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => { setMode('uri'); setPreview(null); }}
          style={mode === 'uri' ? styles.activeTab : styles.tab}
        >
          URI / QR Code
        </button>
        <button
          onClick={() => { setMode('manual'); setPreview(null); }}
          style={mode === 'manual' ? styles.activeTab : styles.tab}
        >
          Manual Entry
        </button>
      </div>

      {!preview ? (
        mode === 'uri' ? (
          <div style={styles.section}>
            <QrScanner onScan={handleQrScan} />
            <div style={styles.divider}>or paste URI</div>
            <div style={styles.inputRow}>
              <input
                type="text"
                placeholder="otpauth://totp/..."
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                style={styles.input}
              />
              <button onClick={() => handleUriParse()} style={styles.parseBtn}>
                Parse
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.section}>
            <label style={styles.label}>
              Label *
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} style={styles.input} placeholder="user@example.com" />
            </label>
            <label style={styles.label}>
              Issuer
              <input type="text" value={issuer} onChange={(e) => setIssuer(e.target.value)} style={styles.input} placeholder="GitHub" />
            </label>
            <label style={styles.label}>
              Secret (Base32) *
              <input type="text" value={secret} onChange={(e) => setSecret(e.target.value.toUpperCase())} style={styles.input} placeholder="JBSWY3DPEHPK3PXP" />
            </label>
            <div style={styles.row}>
              <label style={styles.label}>
                Algorithm
                <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} style={styles.input}>
                  <option>SHA1</option>
                  <option>SHA256</option>
                  <option>SHA512</option>
                </select>
              </label>
              <label style={styles.label}>
                Digits
                <select value={digits} onChange={(e) => setDigits(Number(e.target.value))} style={styles.input}>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                </select>
              </label>
              <label style={styles.label}>
                Period
                <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} style={styles.input}>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                </select>
              </label>
            </div>
            <button onClick={handleManualPreview} style={styles.parseBtn}>
              Preview
            </button>
          </div>
        )
      ) : (
        <SecretPreview
          label={preview.label}
          issuer={preview.issuer}
          algorithm={preview.algorithm}
          digits={preview.digits}
          period={preview.period}
          onSave={handleSave}
          onCancel={() => setPreview(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '600px',
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.25rem',
    marginBottom: '1.5rem',
  },
  tab: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  activeTab: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--accent)',
    background: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--accent)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  divider: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    position: 'relative' as const,
  },
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.625rem 0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '0.9rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    fontSize: '0.85rem',
    fontWeight: 500,
    flex: 1,
  },
  row: {
    display: 'flex',
    gap: '0.75rem',
  },
  parseBtn: {
    padding: '0.625rem 1.25rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600,
    flexShrink: 0,
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
  success: {
    padding: '0.625rem 0.75rem',
    borderRadius: 'var(--radius)',
    background: 'rgba(34, 197, 94, 0.1)',
    color: 'var(--success)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashLink: {
    color: 'var(--accent)',
    fontSize: '0.85rem',
  },
};
