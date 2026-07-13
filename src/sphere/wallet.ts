/**
 * Wallet-layer helpers: backup/restore state, balance, minting, nametags.
 * All functions lazily pull the singleton Sphere.
 */
import {
  getCoinIdBySymbol,
  isValidNametag,
  validateMnemonic,
  type Asset,
  type PeerInfo,
} from '@unicitylabs/sphere-sdk';
import { UCT_COIN_ID, UCT_SYMBOL, parseUct } from '../lib/amounts';
import { getSphere } from './client';

/** Resolve UCT's hex coin id — registry first, pinned testnet2 value as fallback. */
export function uctCoinId(): string {
  return getCoinIdBySymbol(UCT_SYMBOL) ?? UCT_COIN_ID;
}

export function isMnemonicValid(mnemonic: string): boolean {
  return validateMnemonic(mnemonic.trim().toLowerCase().replace(/\s+/g, ' '));
}

/** UCT balance in base units (confirmed + unconfirmed spendable). */
export async function getUctBalance(): Promise<bigint> {
  const sphere = await getSphere();
  const assets = await sphere.payments.getAssets();
  const uct = assets.find((a) => a.symbol === UCT_SYMBOL || a.coinId === uctCoinId());
  return uct ? BigInt(uct.totalAmount) : 0n;
}

export async function getAssets(): Promise<Asset[]> {
  const sphere = await getSphere();
  return sphere.payments.getAssets();
}

/**
 * Self-mint UCT test tokens (there is no faucet on testnet2).
 * Throws a human-ready Error on failure.
 */
export async function mintUct(amountHuman: string): Promise<void> {
  const sphere = await getSphere();
  const amount = parseUct(amountHuman);
  if (amount <= 0n) throw new Error('Mint amount must be greater than zero.');
  const result = await sphere.payments.mintFungibleToken(uctCoinId(), amount);
  if (!result.success) {
    throw new Error(
      `Minting failed: ${result.error}. This usually means the gateway API key is missing or the testnet2 gateway is unreachable — check VITE_UNICITY_API_KEY (.env.example has the public testnet2 key).`,
    );
  }
}

export interface NametagCheck {
  valid: boolean;
  available?: boolean;
  reason?: string;
}

/** Live availability check for the registration modal. */
export async function checkNametag(raw: string): Promise<NametagCheck> {
  const name = raw.trim().toLowerCase().replace(/^@/, '');
  if (!name) return { valid: false, reason: 'Enter a name.' };
  if (!isValidNametag(name)) {
    return {
      valid: false,
      reason: '3–20 characters: lowercase letters, numbers, _ or -.',
    };
  }
  const sphere = await getSphere();
  const available = await sphere.isNametagAvailable(name);
  return {
    valid: true,
    available,
    reason: available ? undefined : `@${name} is already taken (nametags are first-come, first-served).`,
  };
}

/** Register a nametag for this wallet. Throws with a human message on conflict. */
export async function registerNametag(raw: string): Promise<string> {
  const name = raw.trim().toLowerCase().replace(/^@/, '');
  const check = await checkNametag(name);
  if (!check.valid || check.available === false) {
    throw new Error(check.reason ?? 'That nametag cannot be registered.');
  }
  const sphere = await getSphere();
  try {
    await sphere.registerNametag(name);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/taken|already/i.test(msg)) {
      throw new Error(
        `@${name} is already registered to a different wallet. Nametags are first-seen-wins and bound to a public key — pick another name.`,
      );
    }
    throw err;
  }
  return name;
}

/**
 * Resolve any identifier (@nametag, DIRECT://, pubkey) to a network identity.
 * Returns null when the identity doesn't exist on the network.
 */
export async function resolvePeer(identifier: string): Promise<PeerInfo | null> {
  const sphere = await getSphere();
  try {
    return await sphere.resolve(identifier);
  } catch {
    return null;
  }
}
