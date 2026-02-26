import crypto from 'node:crypto';

// Generate deterministic test keys
process.env.DB_PATH = ':memory:';
process.env.DB_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.SECRET_ENCRYPTION_KEY = 'b'.repeat(64);
process.env.SESSION_SECRET = 'c'.repeat(64);
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'testpass123';
