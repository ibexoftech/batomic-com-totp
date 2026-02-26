'use client';

import { useRouter, usePathname } from 'next/navigation';

interface NavbarProps {
  username: string;
  role: string;
}

export default function Navbar({ username, role }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const links = [
    { href: '/dashboard', label: 'Codes' },
    ...(role === 'admin'
      ? [
          { href: '/dashboard/add', label: 'Add Secret' },
          { href: '/dashboard/secrets', label: 'Secrets' },
          { href: '/dashboard/users', label: 'Users' },
          { href: '/dashboard/audit', label: 'Audit Log' },
        ]
      : []),
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <span style={styles.brand}>TOTP</span>
        <div style={styles.links}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                ...styles.link,
                ...(pathname === link.href ? styles.activeLink : {}),
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div style={styles.right}>
        <span style={styles.user}>{username} ({role})</span>
        <button onClick={handleLogout} style={styles.logout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  brand: {
    fontWeight: 700,
    fontSize: '1.1rem',
    letterSpacing: '0.05em',
  },
  links: {
    display: 'flex',
    gap: '0.25rem',
  },
  link: {
    padding: '0.375rem 0.75rem',
    borderRadius: 'var(--radius)',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
  },
  activeLink: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  user: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  logout: {
    padding: '0.375rem 0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
  },
};
