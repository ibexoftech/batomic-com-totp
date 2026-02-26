import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from '../crypto';

describe('crypto', () => {
  it('encrypts and decrypts a secret round-trip', () => {
    const plaintext = 'JBSWY3DPEHPK3PXP';
    const { encrypted, iv, authTag } = encryptSecret(plaintext);
    const result = decryptSecret(encrypted, iv, authTag);
    expect(result).toBe(plaintext);
  });

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const plaintext = 'JBSWY3DPEHPK3PXP';
    const a = encryptSecret(plaintext);
    const b = encryptSecret(plaintext);
    expect(a.iv).not.toEqual(b.iv);
    expect(a.encrypted).not.toEqual(b.encrypted);
  });

  it('throws on tampered ciphertext', () => {
    const { encrypted, iv, authTag } = encryptSecret('JBSWY3DPEHPK3PXP');
    encrypted[0] ^= 0xff; // flip a byte
    expect(() => decryptSecret(encrypted, iv, authTag)).toThrow();
  });

  it('throws on tampered auth tag', () => {
    const { encrypted, iv, authTag } = encryptSecret('JBSWY3DPEHPK3PXP');
    authTag[0] ^= 0xff;
    expect(() => decryptSecret(encrypted, iv, authTag)).toThrow();
  });

  it('throws with wrong key', () => {
    const { encrypted, iv, authTag } = encryptSecret('JBSWY3DPEHPK3PXP');
    const origKey = process.env.SECRET_ENCRYPTION_KEY;
    process.env.SECRET_ENCRYPTION_KEY = 'd'.repeat(64);
    expect(() => decryptSecret(encrypted, iv, authTag)).toThrow();
    process.env.SECRET_ENCRYPTION_KEY = origKey;
  });
});
