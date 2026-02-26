'use client';

import { useState } from 'react';
import CountdownRing from './CountdownRing';
import type { TotpCode } from '@/types';

interface CodeCardProps {
  code: TotpCode;
}

export default function CodeCard({ code }: CodeCardProps) {
  const [copied, setCopied] = useState(false);

  const formatted = code.code.length === 6
    ? `${code.code.slice(0, 3)} ${code.code.slice(3)}`
    : code.code;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may not be available
    }
  }

  return (
    <div style={styles.card} onClick={handleCopy} role="button" tabIndex={0}>
      <div style={styles.header}>
        <div style={styles.info}>
          {code.issuer && <div style={styles.issuer}>{code.issuer}</div>}
          <div style={styles.label}>{code.label}</div>
        </div>
        <CountdownRing remaining={code.remaining} period={code.period} />
      </div>
      <div style={styles.codeRow}>
        <span style={styles.code}>{formatted}</span>
        <span style={styles.copyHint}>{copied ? 'Copied!' : 'Click to copy'}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem 1.25rem',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  info: {
    minWidth: 0,
    flex: 1,
  },
  issuer: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.125rem',
  },
  label: {
    fontSize: '0.875rem',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  codeRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  code: {
    fontSize: '1.75rem',
    fontWeight: 700,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    letterSpacing: '0.1em',
  },
  copyHint: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
};
