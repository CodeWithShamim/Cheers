/**
 * Amount parsing — bigint/base-unit strings only, never floats.
 * Thin wrappers over the SDK's currency utilities with UCT defaults.
 * (Display formatting lives in ./format.ts, which is SDK-free so the app
 * shell doesn't pull the SDK bundle — this module is only imported from
 * code-split pages that load the SDK anyway.)
 */
import { parseTokenAmount, safeParseTokenAmount } from '@unicitylabs/sphere-sdk';
import { UCT_DECIMALS } from './format';

export { UCT_COIN_ID, UCT_DECIMALS, UCT_SYMBOL, formatUct, formatUctWithSymbol } from './format';

/** "1.5" → base units bigint. Throws on invalid input. */
export function parseUct(human: string): bigint {
  return parseTokenAmount(human, UCT_DECIMALS);
}

/** Like parseUct but returns null instead of throwing (for live input validation). */
export function safeParseUct(human: string): bigint | null {
  return safeParseTokenAmount(human, UCT_DECIMALS);
}
