import { describe, it, expect } from 'vitest';
import { maskPII } from './pii';

describe('PII Shield Engine', () => {
  it('masks valid Indian phone numbers', () => {
    const res = maskPII('Call me at +91-98765-43210 or 9876543210.');
    expect(res.masked).toContain('[PHONE ••••3210]');
    expect(res.items.length).toBe(2);
  });

  it('masks emails and UPIs correctly', () => {
    const res = maskPII('Email rahul.g@gmail.com or UPI rahul@okhdfc');
    expect(res.masked).toContain('[EMAIL]');
    expect(res.masked).toContain('[UPI]');
    expect(res.items.find(i => i.type === 'EMAIL')?.original).toBe('rahul.g@gmail.com');
    expect(res.items.find(i => i.type === 'UPI')?.original).toBe('rahul@okhdfc');
  });

  it('masks OTP codes securely', () => {
    const res = maskPII('Your verification code is 123456 do not share it');
    expect(res.masked).toContain('[OTP]');
    expect(res.hasHighRisk).toBe(true);
  });

  it('ignores false positives like dates, times, and amounts', () => {
    const res = maskPII('On 12/03/2026 at 9:41, we paid 5000 rupees for 10 people.');
    expect(res.items.length).toBe(0);
    expect(res.masked).toBe('On 12/03/2026 at 9:41, we paid 5000 rupees for 10 people.');
  });

  it('masks Luhn valid cards', () => {
    // 4242 4242 4242 4242 is a standard stripe test luhn valid card
    const res = maskPII('My card is 4242 4242 4242 4242 use it.');
    expect(res.masked).toContain('[CARD ••••4242]');
    expect(res.hasHighRisk).toBe(true);
  });
});
