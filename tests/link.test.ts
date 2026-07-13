import { describe, expect, it } from 'vitest';
import {
  buildCardUrl,
  decodeCardToken,
  encodeCardToken,
  extractCardToken,
  InvalidCardLinkError,
} from '../src/link';

const payload = {
  groupId: "abc123'group",
  invite: 'INV-xyz-789',
};

describe('card link codec', () => {
  it('round-trips a payload', () => {
    const token = encodeCardToken(payload);
    const decoded = decodeCardToken(token);
    expect(decoded).toEqual({ v: 1, ...payload });
  });

  it('round-trips with a relay override', () => {
    const withRelay = { ...payload, relay: 'wss://sphere-relay.unicity.network' };
    expect(decodeCardToken(encodeCardToken(withRelay))).toEqual({ v: 1, ...withRelay });
  });

  it('produces URL-safe tokens (no +, /, =)', () => {
    // Payload chosen to force +/= in plain base64
    const token = encodeCardToken({ groupId: '???>>>???', invite: '~~~!!!~~~' });
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('handles unicode in fields', () => {
    const unicode = { groupId: 'grüppe-🎂', invite: 'clé-💌' };
    expect(decodeCardToken(encodeCardToken(unicode))).toEqual({ v: 1, ...unicode });
  });

  it('accepts a leading # on decode', () => {
    const token = encodeCardToken(payload);
    expect(decodeCardToken(`#${token}`)).toEqual({ v: 1, ...payload });
  });

  it('throws InvalidCardLinkError on garbage', () => {
    expect(() => decodeCardToken('not-base64-json!!!')).toThrow(InvalidCardLinkError);
    expect(() => decodeCardToken('')).toThrow(InvalidCardLinkError);
    expect(() => decodeCardToken('aGVsbG8')).toThrow(InvalidCardLinkError); // "hello"
  });

  it('throws on structurally wrong payloads (missing invite, wrong version)', () => {
    const noInvite = btoa(JSON.stringify({ v: 1, groupId: 'g' }));
    expect(() => decodeCardToken(noInvite)).toThrow(InvalidCardLinkError);
    const wrongVersion = btoa(JSON.stringify({ v: 2, groupId: 'g', invite: 'i' }));
    expect(() => decodeCardToken(wrongVersion)).toThrow(InvalidCardLinkError);
  });

  it('builds a full URL whose hash decodes back', () => {
    const url = buildCardUrl('https://cheers.example.com/', payload);
    expect(url).toMatch(/^https:\/\/cheers\.example\.com\/c\/#/);
    const token = extractCardToken(url);
    expect(token).not.toBeNull();
    expect(decodeCardToken(token!)).toEqual({ v: 1, ...payload });
  });

  it('extractCardToken handles bare tokens and empty input', () => {
    const token = encodeCardToken(payload);
    expect(extractCardToken(token)).toBe(token);
    expect(extractCardToken('   ')).toBeNull();
    expect(extractCardToken('https://x.example/c/#')).toBeNull();
  });
});
