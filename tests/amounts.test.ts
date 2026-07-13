import { describe, expect, it } from 'vitest';
import { formatUct, formatUctWithSymbol, parseUct, safeParseUct, UCT_DECIMALS } from '../src/lib/amounts';

describe('amount utilities (UCT, 18 decimals)', () => {
  it('parses whole and fractional amounts to base units', () => {
    expect(parseUct('1')).toBe(10n ** BigInt(UCT_DECIMALS));
    expect(parseUct('1.5')).toBe(15n * 10n ** BigInt(UCT_DECIMALS - 1));
    expect(parseUct('0')).toBe(0n);
  });

  it('round-trips parse → format', () => {
    expect(formatUct(parseUct('230'))).toBe('230');
    expect(formatUct(parseUct('1.5'))).toBe('1.5');
    expect(formatUct(parseUct('0.000000000000000001'))).toBe('0.000000000000000001');
  });

  it('formats base-unit strings too', () => {
    expect(formatUct('0')).toBe('0');
    expect(formatUctWithSymbol(parseUct('5'))).toBe('5 UCT');
  });

  it('safeParse returns null instead of throwing', () => {
    expect(safeParseUct('not a number')).toBeNull();
    expect(safeParseUct('1.5')).toBe(parseUct('1.5'));
  });

  it('never loses precision on large sums', () => {
    const a = parseUct('999999999.999999999999999999');
    const b = parseUct('0.000000000000000001');
    expect(formatUct(a + b)).toBe('1000000000');
  });

  it('pure formatUct matches the SDK toHumanReadable (modulo trailing zeros)', async () => {
    const { toHumanReadable } = await import('@unicitylabs/sphere-sdk');
    const samples = [0n, 1n, parseUct('1'), parseUct('1.5'), parseUct('230'), parseUct('0.000001')];
    for (const s of samples) {
      const sdk = toHumanReadable(s, UCT_DECIMALS);
      const sdkTrimmed = sdk.includes('.') ? sdk.replace(/\.?0+$/, '') || '0' : sdk;
      expect(formatUct(s)).toBe(sdkTrimmed);
    }
  });
});
