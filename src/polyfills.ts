/**
 * Browser polyfills that must run before the Sphere SDK / bip39 load.
 *
 * bip39 (pulled in by the SDK's mnemonic helpers) reads the *global* `Buffer`
 * at call time. Vite doesn't provide a Node `Buffer` in the browser, so without
 * this shim `bip39.validateMnemonic` throws internally and returns `false` for
 * every phrase - making valid recovery phrases look invalid and breaking new
 * wallet generation. Assigning the global once here fixes both paths.
 */
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
