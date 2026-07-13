/**
 * Local type declarations for `@unicitylabs/sphere-sdk/impl/browser`.
 *
 * The SDK's package.json `exports` map ships NO `types` entry for this
 * subpath (v0.11.9), so TypeScript cannot resolve it under
 * `moduleResolution: bundler`. The runtime exports exist (verified against
 * dist/impl/browser/index.js); these declarations cover the slice we use.
 * See NOTES.md.
 */
declare module '@unicitylabs/sphere-sdk/impl/browser' {
  import type {
    NetworkType,
    OracleProvider,
    StorageProvider,
    TokenStorageProvider,
    TransportProvider,
    TxfStorageDataBase,
  } from '@unicitylabs/sphere-sdk';

  export interface BrowserProvidersConfig {
    /** Required — selects gateway/relay presets. 'testnet' == testnet2. */
    network: NetworkType;
    storage?: { prefix?: string };
    transport?: {
      relays?: string[];
      additionalRelays?: string[];
      timeout?: number;
      autoReconnect?: boolean;
      debug?: boolean;
    };
    oracle?: {
      url?: string;
      apiKey?: string;
      timeout?: number;
    };
  }

  export interface BrowserProviders {
    storage: StorageProvider;
    transport: TransportProvider;
    oracle: OracleProvider;
    tokenStorage: TokenStorageProvider<TxfStorageDataBase>;
  }

  export function createBrowserProviders(config: BrowserProvidersConfig): BrowserProviders;
  export function createLocalStorageProvider(config?: { prefix?: string }): StorageProvider;
}
