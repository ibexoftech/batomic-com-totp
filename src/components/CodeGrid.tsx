'use client';

import { useState, useEffect, useRef } from 'react';
import CodeCard from './CodeCard';
import type { TotpCode } from '@/types';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';

export default function CodeGrid() {
  const [codes, setCodes] = useState<TotpCode[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      setStatus((prev) => (prev === 'connecting' ? 'connecting' : 'reconnecting'));

      const es = new EventSource('/api/codes/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus('connected');
      };

      es.onmessage = (event) => {
        try {
          const data: TotpCode[] = JSON.parse(event.data);
          setCodes(data);
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        setStatus('reconnecting');
        retryTimeoutRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  return (
    <div>
      <div style={styles.statusBar}>
        <span style={{
          ...styles.statusDot,
          background: status === 'connected' ? 'var(--success)' : 'var(--warning)',
        }} />
        <span style={styles.statusText}>
          {status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
        </span>
      </div>

      {codes.length === 0 ? (
        <div style={styles.empty}>
          {status === 'connected'
            ? 'No secrets added yet. Add one to get started.'
            : 'Loading codes...'}
        </div>
      ) : (
        <div style={styles.grid}>
          {codes.map((code) => (
            <CodeCard key={code.id} code={code} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  empty: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    padding: '3rem 1rem',
    fontSize: '0.9rem',
  },
};
