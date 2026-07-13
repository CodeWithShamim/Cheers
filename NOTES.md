# NOTES — spec vs. the real Sphere SDK (v0.11.9)

(`scripts/live-verify.ts` — all checks pass).

## Provider composition

1. **Two provider layers are required, not one.** The spec says
   `createBrowserProviders({ network, oracle })` is enough. In SDK v2 that
   builds only storage + Nostr transport + oracle; without
   `createWalletApiProviders(base, { baseUrl, network: 'testnet2', deviceId })`
   the wallet _silently_ cannot send or receive v2 transfers (delivery rides
   the wallet-api mailbox, not Nostr). `src/sphere/client.ts` composes both
   layers.
2. **`network` is required on `Sphere.init` too** — it configures the
   TokenRegistry; omitting it throws `INVALID_CONFIG` ("network is required to
   configure the TokenRegistry"). The SDK README calls it "informational",
   which is out of date.
3. **`@unicitylabs/sphere-sdk/impl/browser` ships no TypeScript types** (its
   `exports` entry has no `types` field), so `moduleResolution: bundler`
   can't resolve it. Local ambient declarations in
   `src/sphere/sdk-browser.d.ts` cover the slice we use (shape verified
   against the runtime exports).

## Group chat (NIP-29)

4. **Method signatures differ from the spec:**
   - `fetchMessages(groupId, since?, limit?)` — positional args, not an
     options object.
   - `sendMessage(groupId, content, replyToId?)` — returns
     `GroupMessageData | null` (null = relay refused), doesn't throw.
   - `createGroup(options)` returns `GroupData | null`; `createInvite(groupId)`
     returns `string | null`; `joinGroup(groupId, invite?)` returns `boolean`.
     All null/false results are surfaced as human errors.
5. **Group ids are short relay-scoped strings** (e.g. `cheersfarewellsaraiz`),
   not UUIDs, and the group-chat relay is `wss://sphere-relay.unicity.network`
   — separate from the messaging/nametag relay.
6. **The group "creator pubkey" is not exposed** by the SDK's group API, so the
   spec's meta-trust rule "earliest by timestamp / sender == group creator"
   is implemented as _earliest by timestamp with deterministic message-id
   tiebreak_ (`parseCard`). An imposter cannot pre-date the creator's meta:
   the creator posts `card.meta` before the invite exists, so no one else is
   in the group yet. Covered by unit tests.
7. **A member's group-chat sender pubkey equals their transport pubkey**
   (x-only form of the compressed chain key) — verified live. `card.thanks`
   verification therefore matches the message sender against the recipient's
   resolved `transportPubkey`/`chainPubkey` (with 02/03-prefix normalization
   in `pubkeysEqual`).

## Payments

8. **`transferId` is `TransferResult.id`** (a UUID), not a dedicated field.
9. **UCT has 18 decimals** on testnet2 (coin id
   `f581d…4dc0`), so the spec's example base-unit amounts ("5000000") would be
   dust. All amounts go through the SDK's `parseTokenAmount(…, 18)` /
   `toHumanReadable`. `getCoinIdBySymbol('UCT')` only works after
   `Sphere.init` loads the registry; a pinned testnet2 coin id is kept as a
   fallback (`src/lib/format.ts`).
10. **Recipient resolution** uses `sphere.resolve('@name')` → `PeerInfo | null`
    (there is no dedicated `resolveNametag` on Sphere). Recipient detection on
    the card page compares `PeerInfo.chainPubkey` to the viewer's
    `identity.chainPubkey`.
11. **`CERTIFICATION_UNCONFIRMED` (a.k.a. `ProofUnconfirmedError`)**: the spend
    may already be certified; re-sending would double-pay. On this error the
    app posts the signature _without_ a transferId (renders with the
    "unverified" badge — honest, since we can't know the id) and tells the
    user not to retry; the SDK's `resumeOpenIntents()` completes the transfer
    under the same transferId at next init.
12. **`mintFungibleToken(coinIdHex, bigint)` returns a result object**
    (`{ success, tokenId } | { success: false, error }`), it does not throw —
    the wallet layer converts failures into human messages with the API-key
    hint.

## Wallet lifecycle

13. **Backup** uses `sphere.getMnemonic()`; **restore** = `sphere.destroy()` +
    wipe of `sphere_*` localStorage keys + re-`Sphere.init({ mnemonic })`. The
    SDK auto-recovers a registered nametag from Nostr after import
    (`nametag:recovered` event).
14. A **stable `deviceId`** is persisted (`cheers_device_id`) so the wallet-api
    session doesn't re-challenge on every page load.

## App-side deviations

15. **Bundle discipline**: display formatting was split into SDK-free
    `src/lib/format.ts` so the header wallet widget doesn't drag the ~1.7 MB
    SDK into the landing bundle; the SDK loads via dynamic `import()` on first
    wallet use only. A unit test asserts the pure formatter matches the SDK's
    `toHumanReadable`.
16. **Vitest 2 bundles Vite 5**, which type-conflicts with the app's Vite 6 —
    test config lives in a separate `vitest.config.ts`.
17. The experimental **invoicing/accounting module is not used** (per spec) —
    `Sphere.init` is called without `accounting`.
