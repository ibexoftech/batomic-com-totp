import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TOTP Authenticator',
  description: 'Shared TOTP authenticator for workgroups',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
