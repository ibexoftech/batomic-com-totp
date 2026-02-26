# TOTP Authenticator

Shared TOTP authenticator for small workgroups. Served on a LAN from a Mac Mini with real-time code updates via SSE.

## Quick Start

```bash
# Install dependencies
npm install

# Seed the admin user (edit .env.local first)
npm run seed

# Development (with auto-HTTPS)
npm run dev

# Production
npm run build
npm start
```

## Setup

1. Copy `.env.example` to `.env.local` and fill in all values:
   - Generate encryption keys: `openssl rand -hex 32`
   - Set admin username/password

2. Seed the database:
   ```bash
   npm run seed
   ```

3. For production HTTPS, generate certificates:
   ```bash
   brew install mkcert
   mkcert -install
   ./scripts/setup-certs.sh
   ```

4. For iOS camera QR scanning, install the mkcert root CA on each device (see `setup-certs.sh` output).

## Features

- Real-time TOTP codes with countdown timers via SSE
- Add secrets via otpauth:// URI, manual entry, or QR code scan (camera or image upload)
- ChaCha20-Poly1305 encrypted database + AES-256-GCM encrypted secrets
- HMAC-signed session cookies with scrypt password hashing
- Role-based access (admin/viewer)
- Audit logging
- Dark/light mode support

## Tech Stack

Next.js 15 (App Router), better-sqlite3-multiple-ciphers, otpauth, html5-qrcode, mkcert

## Auto-Start on macOS

```bash
./scripts/setup-launchd.sh
```
