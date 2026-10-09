import { describe, it, expect } from 'vitest';
import { parseWhatsApp } from './parser';

describe('WhatsApp Parser', () => {
  it('parses format 1: 12h time without brackets', () => {
    const text = `12/03/2026, 9:41 pm - Alice: Hello there!\n12/03/2026, 9:42 pm - Bob: Hi Alice!`;
    const msgs = parseWhatsApp(text);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].sender).toBe('Alice');
    expect(msgs[0].text).toBe('Hello there!');
    expect(msgs[1].sender).toBe('Bob');
    expect(msgs[1].text).toBe('Hi Alice!');
  });

  it('parses format 2: 24h time with brackets', () => {
    const text = `[12/03/26, 21:41:05] Charlie: Testing bracket format\n[12/03/26, 21:42:00] Dave: Looks good`;
    const msgs = parseWhatsApp(text);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].sender).toBe('Charlie');
    expect(msgs[0].text).toBe('Testing bracket format');
    expect(msgs[1].sender).toBe('Dave');
    expect(msgs[1].text).toBe('Looks good');
  });

  it('merges multi-line messages', () => {
    const text = `12/03/26, 9:41 pm - Eve: First line\nSecond line\nThird line\n12/03/26, 9:45 pm - Frank: Ok`;
    const msgs = parseWhatsApp(text);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].text).toBe('First line\nSecond line\nThird line');
    expect(msgs[1].sender).toBe('Frank');
  });

  it('skips system messages', () => {
    const text = `12/03/26, 9:41 pm - Messages and calls are end-to-end encrypted.\n12/03/26, 9:42 pm - Alice: Real message\n12/03/26, 9:43 pm - Alice: <Media omitted>\n12/03/26, 9:44 pm - Bob: Another message\n12/03/26, 9:45 pm - Bob: You deleted this message\n12/03/26, 9:46 pm - System: joined using this group's invite link`;
    const msgs = parseWhatsApp(text);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].text).toBe('Real message');
    expect(msgs[1].text).toBe('Another message');
  });
});
