/**
 * Pure UCT display formatting - deliberately SDK-free so the app shell
 * (header wallet widget) doesn't pull the whole SDK into the landing-page
 * bundle. Equivalence with the SDK's toHumanReadable is asserted in tests.
 */

/** UCT on testnet2 (from the testnet2 token registry). */
export const UCT_SYMBOL = 'UCT';
export const UCT_COIN_ID = 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0';
export const UCT_DECIMALS = 18;

/** Base units (bigint or decimal string) → human string, trailing zeros trimmed. */
export function formatUct(baseUnits: bigint | string): string {
  const units = typeof baseUnits === 'string' ? BigInt(baseUnits) : baseUnits;
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const divisor = 10n ** BigInt(UCT_DECIMALS);
  const whole = abs / divisor;
  const frac = abs % divisor;
  let out = whole.toString();
  if (frac > 0n) {
    const fracStr = frac.toString().padStart(UCT_DECIMALS, '0').replace(/0+$/, '');
    out += `.${fracStr}`;
  }
  return negative ? `-${out}` : out;
}

/** Human display with symbol: "230 UCT". */
export function formatUctWithSymbol(baseUnits: bigint | string): string {
  return `${formatUct(baseUnits)} ${UCT_SYMBOL}`;
}
