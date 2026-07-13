/**
 * Singleton Sphere client - lazy, browser-only.
 *
 * ALL SDK imports here are dynamic: the SDK (1.7 MB) and its relay
 * connections only load on the first getSphereInit() call, so the landing
 * page paints with zero SDK work or bytes.
 *
 * v2 composition is TWO provider layers (see SDK README):
 *   1. createBrowserProviders  → storage + Nostr transport + oracle
 *   2. createWalletApiProviders → delivery mailbox + wallet-api client
 * Skipping layer 2 silently yields a wallet that cannot send or receive.
 */
import type { Sphere, SphereInitResult } from '@unicitylabs/sphere-sdk';

const WALLET_API_URL = 'https://wallet-api.unicity.network';
const DEVICE_ID_KEY = 'cheers_device_id';
const SDK_STORAGE_PREFIX = 'sphere_'; // mirrors the SDK's STORAGE_PREFIX constant
const CHEERS_STORAGE_PREFIX = 'cheers_'; // all app-local wallet state (device id, backup flag, pending posts, my-cards)
const SDK_IDB_NAME = 'sphere-storage'; // the SDK persists the wallet (keys, tokens) in this IndexedDB database

/**
 * Delete the SDK's IndexedDB store. The wallet itself lives here (NOT in
 * localStorage), so wiping it is what actually erases the wallet on sign-out /
 * before a restore. Best-effort: resolves even if blocked (the caller reloads
 * right after, which tears down any lingering connection).
 */
function deleteSdkDatabase(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(SDK_IDB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

function getApiKey(): string {
  const key = import.meta.env.VITE_UNICITY_API_KEY as string | undefined;
  if (!key) {
    throw new Error(
      'Missing VITE_UNICITY_API_KEY. Copy .env.example to .env - the testnet2 key in it is public.',
    );
  }
  return key;
}

/** Stable per-device label so wallet-api doesn't force a challenge sign-in every run. */
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `cheers-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

let initPromise: Promise<SphereInitResult> | null = null;

async function doInit(mnemonic?: string): Promise<SphereInitResult> {
  const [{ Sphere }, { createBrowserProviders }, { createWalletApiProviders }] =
    await Promise.all([
      import('@unicitylabs/sphere-sdk'),
      import('@unicitylabs/sphere-sdk/impl/browser'),
      import('@unicitylabs/sphere-sdk/impl/shared/wallet-api'),
    ]);

  const base = createBrowserProviders({
    network: 'testnet', // resolves to the testnet2 v2 gateway
    oracle: { apiKey: getApiKey() },
  });
  const providers = createWalletApiProviders(base, {
    baseUrl: WALLET_API_URL,
    network: 'testnet2',
    deviceId: getDeviceId(),
  });
  return Sphere.init({
    ...providers,
    // Required: Sphere.init configures the TokenRegistry from this.
    network: 'testnet',
    autoGenerate: true,
    ...(mnemonic ? { mnemonic } : {}),
    groupChat: true,
  });
}

/**
 * Initialize (or return the already-initialized) Sphere. The result includes
 * `created` / `generatedMnemonic` so the UI can force the backup step on
 * first run.
 */
export function getSphereInit(): Promise<SphereInitResult> {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

export async function getSphere(): Promise<Sphere> {
  return (await getSphereInit()).sphere;
}

/**
 * Restore a wallet from a mnemonic: tear down the current instance, wipe the
 * SDK's localStorage state, and re-init with the provided phrase. The SDK
 * auto-recovers a registered nametag from Nostr after import.
 */
export async function restoreFromMnemonic(mnemonic: string): Promise<SphereInitResult> {
  if (initPromise) {
    try {
      const { sphere } = await initPromise;
      await sphere.destroy();
    } catch {
      // best-effort teardown; storage wipe below is authoritative
    }
  }
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(SDK_STORAGE_PREFIX)) localStorage.removeItem(key);
  }
  initPromise = doInit(mnemonic.trim());
  try {
    return await initPromise;
  } catch (err) {
    initPromise = null; // don't cache a failed restore
    throw err;
  }
}

/**
 * Sign out: tear down the current wallet and erase ALL local state for it.
 *
 * The wallet's keys live only in this browser, so this is irreversible unless
 * the user has saved their recovery phrase - callers must warn first. Wipes
 * both the SDK's `sphere_*` keys AND every `cheers_*` key (device id, backup
 * flag, pending posts, my-cards) so the next load starts a brand-new wallet.
 */
export async function logoutWallet(): Promise<void> {
  if (initPromise) {
    try {
      const { sphere } = await initPromise;
      await sphere.destroy();
    } catch {
      // best-effort teardown; the storage wipe below is authoritative
    }
    initPromise = null;
  }
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(SDK_STORAGE_PREFIX) || key.startsWith(CHEERS_STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
  await deleteSdkDatabase();
}

/** Whether the SDK has ever been initialized in this session. */
export function isSphereStarted(): boolean {
  return initPromise !== null;
}

/**
 * Whether this browser has already been through wallet setup.
 *
 * The onboarding gate uses this to tell a RETURNING visitor (load their wallet
 * silently) from a BRAND-NEW one (let them choose create vs restore before we
 * ever generate keys). The SDK keeps the wallet itself in IndexedDB - which we
 * can't read synchronously here - and namespaces that storage by `deviceId`.
 * `cheers_device_id` is written on the first SDK init and wiped on logout, so
 * its presence is a reliable synchronous proxy: it exists exactly when a wallet
 * was set up on this device and hasn't been signed out. A rare miss is safe -
 * init() then loads the existing wallet rather than replacing it, since the SDK
 * only auto-generates when no wallet exists for the current deviceId.
 */
export function hasStoredWallet(): boolean {
  return localStorage.getItem(DEVICE_ID_KEY) !== null;
}
