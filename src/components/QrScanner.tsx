'use client';

import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
  onScan: (uri: string) => void;
}

export default function QrScanner({ onScan }: QrScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<InstanceType<typeof import('html5-qrcode').Html5Qrcode> | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  async function startCamera() {
    setError('');
    if (!scannerRef.current) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (decodedText.startsWith('otpauth://')) {
            onScan(decodedText);
            scanner.stop().catch(() => {});
            setScanning(false);
          }
        },
        () => {}, // ignore scan failures
      );
      setScanning(true);
    } catch (err) {
      setError((err as Error).message || 'Camera access failed. Ensure HTTPS is enabled.');
    }
  }

  function stopCamera() {
    html5QrRef.current?.stop().catch(() => {});
    setScanning(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-file-reader');
      const result = await scanner.scanFile(file, true);
      if (result.startsWith('otpauth://')) {
        onScan(result);
      } else {
        setError('QR code does not contain an otpauth:// URI');
      }
      scanner.clear();
    } catch {
      setError('Could not read QR code from image');
    }
  }

  useEffect(() => {
    return () => {
      html5QrRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div>
      <div style={styles.buttons}>
        {!scanning ? (
          <button onClick={startCamera} style={styles.btn}>
            Scan with Camera
          </button>
        ) : (
          <button onClick={stopCamera} style={styles.btnDanger}>
            Stop Camera
          </button>
        )}
        <label style={styles.btn}>
          Upload QR Image
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div
        id="qr-reader"
        ref={scannerRef}
        style={{ ...styles.reader, display: scanning ? 'block' : 'none' }}
      />
      <div id="qr-file-reader" style={{ display: 'none' }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  buttons: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
    marginBottom: '1rem',
  },
  btn: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  btnDanger: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    background: 'var(--danger)',
    color: '#fff',
    fontSize: '0.85rem',
  },
  error: {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  reader: {
    maxWidth: '400px',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
};
