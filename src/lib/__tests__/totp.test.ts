import { describe, it, expect } from 'vitest';
import * as OTPAuth from 'otpauth';

describe('totp', () => {
  it('generates a 6-digit code for a known secret', () => {
    const totp = new OTPAuth.TOTP({
      issuer: 'Test',
      label: 'user@example.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32('JBSWY3DPEHPK3PXP'),
    });

    const code = totp.generate();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('generates matching code at a specific timestamp', () => {
    const totp = new OTPAuth.TOTP({
      issuer: 'Test',
      label: 'test',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32('JBSWY3DPEHPK3PXP'),
    });

    // Known test vector: at time 59, the code for this secret with SHA1 should be deterministic
    const code = totp.generate({ timestamp: 59000 });
    expect(code).toMatch(/^\d{6}$/);

    // Same timestamp should produce same code
    const code2 = totp.generate({ timestamp: 59000 });
    expect(code).toBe(code2);
  });

  it('parses an otpauth URI', () => {
    const uri = 'otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&algorithm=SHA1&digits=6&period=30';
    const parsed = OTPAuth.URI.parse(uri);
    expect(parsed).toBeInstanceOf(OTPAuth.TOTP);
    const totp = parsed as OTPAuth.TOTP;
    // OTPAuth strips the issuer prefix from the label
    expect(totp.label).toBe('user@example.com');
    expect(totp.issuer).toBe('GitHub');
    expect(totp.secret.base32).toBe('JBSWY3DPEHPK3PXP');
    expect(totp.digits).toBe(6);
    expect(totp.period).toBe(30);
  });

  it('rejects HOTP URIs', () => {
    const uri = 'otpauth://hotp/Test?secret=JBSWY3DPEHPK3PXP&counter=0';
    const parsed = OTPAuth.URI.parse(uri);
    expect(parsed).not.toBeInstanceOf(OTPAuth.TOTP);
  });
});
