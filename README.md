# 🥂 Cheers — group cards with real money inside

**Cheers** is a collaborative greeting card where the gift is real. Someone starts a card for
`@sara` — a birthday, a farewell, a congrats — and shares one link. Every friend who opens it
signs with a note and an emoji, and can chip in tokens that go **straight to Sara's wallet,
peer-to-peer**. The card fills up live; Sara opens a single page with every message, a running
total of what friends gave her, confetti, and a "say thanks" box that posts back to everyone.

It runs on the **Unicity testnet2** network and is built for the Unicity Sphere builder
campaign (Social & messaging track).

## The thesis: no server, anywhere

This app is a static bundle of HTML/JS. There is no backend, no database, no API of ours:

- **The network is the database.** Every card *is* a private NIP-29 group chat on the Unicity
  relay. The card's metadata is the first message in the group; every signature is a signed
  JSON message; the recipient's thank-you is a message. Rendering a card = join the group,
  fetch its messages, parse, draw.
- **Money never touches us.** A chip-in is a direct `payments.send` from the signer's
  in-browser wallet to the recipient's nametag — engine-certified on the testnet2 gateway.
  There is no pooling and no custody: not by the app, not by the card creator, not by anyone.
  (A pooled/custodial mode is deliberately out of scope.)
- **Keys never leave the browser.** Wallets are generated client-side and persisted in
  localStorage; the first run forces a mnemonic backup.
- **The share link is the only credential**, and it rides the URL *hash fragment* — a static
  host never sees it, because fragments aren't sent in HTTP requests.

```
   friend's browser                                     recipient's browser
  ┌────────────────┐                                   ┌────────────────┐
  │ wallet (local) │        wss://sphere-relay         │ wallet (local) │
  │                │◄──── NIP-29 group = THE CARD ────►│                │
  │  sign + note ──┼──── card.sign JSON message ──────►│  reads wall    │
  │                │                                   │                │
  │  chip-in ──────┼──── v2 token transfer ───────────►│  balance +N    │
  └────────────────┘   gateway.testnet2.unicity.network└────────────────┘
                        (certification) + wallet-api
                          mailbox (delivery)

                     ── no server anywhere ──
        (this app is static files; nothing above talks to us)
```

## Quickstart

```bash
git clone <this repo> && cd cheers
cp .env.example .env      # the testnet2 key inside is public — not a secret
npm install
npm run dev               # http://localhost:5173
```

Try the full loop on one machine: create a card in a normal window, open the share link in a
private/incognito window (separate wallet), sign it there and watch it appear live in the
first window.

```bash
npm test                  # unit tests: protocol, link codec, amounts, pending retry
npm run seed              # seeds a real demo card on testnet2, prints its link
npm run build             # type-check + production build
```

## On-network data model

All card state is versioned JSON inside the card's group. Unknown or malformed messages are
ignored (never a crash) — the group is also just a chat, and humans may type in it.

```jsonc
// posted once by the creator, first message in the group
{ "v":1, "type":"card.meta", "recipient":"@sara", "recipientDisplay":"Sara",
  "occasion":"birthday",            // birthday | farewell | congrats | thanks | custom
  "title":"Happy 30th, Sara!",
  "suggestedAmount":"5000000000000000000",  // optional, base units (UCT has 18 decimals)
  "coinId":"UCT", "theme":"sunset",
  "createdBy":"<creator chain pubkey>", "createdAt":1234567890 }

// one per signer
{ "v":1, "type":"card.sign", "name":"Rafi", "note":"Best boss ever. Don't go!",
  "amount":"5000000000000000000", "coinId":"UCT",
  "transferId":"<from payments.send result>",   // "0" amount allowed: signing without a gift is valid
  "emoji":"🎉", "signedAt":1234567890 }

// optional, recipient only (verified: sender pubkey == resolved recipient pubkey)
{ "v":1, "type":"card.thanks", "note":"You're all amazing 😭", "sentAt":1234567890 }
```

Trust rules (all in pure, unit-tested `src/protocol.ts`):

- Exactly **one `card.meta` is trusted — the earliest** (deterministic tiebreak by message
  id). Later imposter metas are ignored. An imposter can't pre-date the real one: the creator
  posts meta before the invite exists, so nobody else is in the group yet.
- A `card.sign` claiming an amount **without a transferId renders with an "unverified"
  badge** and is excluded from the verified total — visible, but honest.
- Signatures are deduped by message id. `card.thanks` is only surfaced when its sender
  verifies as the recipient.

## The pay-then-post design (deliberately non-atomic)

Chipping in is two independent network actions: (1) `payments.send` → transferId, then
(2) post the `card.sign` message carrying that transferId. There is no way to make these
atomic across two networks — so Cheers is honest about it instead:

- If the **post fails after the payment succeeded**, the fully-built signature is persisted
  locally and **re-posted** on the next app load. The payment is *never* retried — the stored
  transferId proves it already happened.
- If the payment result is **indeterminate** (`CERTIFICATION_UNCONFIRMED`), the app never
  re-sends (that's how you double-pay); the SDK resumes the open intent under the same
  transferId, and the signature posts without an id (shown as unverified).
- Everything is **verifiable**: each signature carries its transferId, so anyone can check the
  claimed gift against the network. The card total counts only verified gifts.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "This nametag doesn't exist on the network yet" | The recipient hasn't registered a Unicity ID. They register in **Wallet → Register a nametag** (or any Sphere wallet); it must resolve before a card can be created for it. |
| "@name is already taken" | Nametags are first-seen-wins and bound to a wallet's public key. Pick another. If it's *your* name failing on a wallet you restored: check the wallet actually loaded (Wallet page shows the address) — a fresh keypair can't re-register the old name. |
| Mint fails | The gateway needs the API key: `.env` → `VITE_UNICITY_API_KEY` (the testnet2 key in `.env.example` is public). Also happens when the testnet2 gateway is down — retry later. |
| "Reconnecting to the relay…" banner | The NIP-29 relay dropped; the SDK auto-reconnects with backoff. New signatures resume flowing when it does. |
| Card opens but is empty / "metadata missing" | Relay hasn't served the group history yet — reopen in a moment. If it persists, the link's invite may have been revoked. |
| **Cleared browser data = lost wallet** | The wallet lives only in localStorage. Without the saved mnemonic, tokens in it are unrecoverable — that's the custody model working as designed. Restore any wallet from its phrase in **Wallet → Restore**. |

## Deploy (static)

Any static host works — there is nothing else to deploy.

**Vercel**: import the repo, framework = Vite, set env var `VITE_UNICITY_API_KEY`. The
included `vercel.json` rewrites all routes to `index.html` (SPA).

**Netlify**: build command `npm run build`, publish dir `dist`, same env var. The included
`netlify.toml` has the SPA redirect.

After deploying, run `APP_ORIGIN=https://your-app.vercel.app npm run seed` to mint a fresh
demo card whose link points at the live site.

## Project layout

```
src/
  protocol.ts        # zod schemas + parseCard — pure, unit-tested
  link.ts            # hash-fragment share-link codec — pure, unit-tested
  sphere/client.ts   # lazy singleton Sphere init (two provider layers, dynamic import)
  sphere/wallet.ts   # mint, balances, nametags, restore helpers
  sphere/cards.ts    # createCard / openCard / signCard / watchCard / sendThanks
  lib/               # amounts (SDK), format (pure), pending-signature store, my-cards index
  pages/             # Landing, Create, Card (+Sign panel), MyCards, Wallet
  components/        # notes, banner, themes, share sheet, confetti, backup, gate…
scripts/
  demo-seed.ts       # seeds a real card with 3 paying signers on testnet2
  live-verify.ts     # end-to-end network verification harness
tests/               # vitest suites for every pure module
```

See `NOTES.md` for every place the real SDK differed from its docs and how the app adapted.
Testnet only: UCT is self-minted test money with no real value.
# Cheers
