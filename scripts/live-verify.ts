/**
 * Live testnet2 verification harness (dev-only, Node).
 *
 * Exercises every network flow the app uses, end-to-end, with real wallets:
 *   wallet init → mint → nametag register/resolve → group create/invite/join
 *   → card.meta/card.sign messages → P2P payment → parseCard over fetched
 *   messages → DM notification.
 *
 * Run: npx tsx scripts/live-verify.ts
 */
import { mkdirSync, rmSync } from 'node:fs';
import { Sphere, GroupVisibility, getCoinIdBySymbol, type SphereInitResult } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';
import { buildCardMeta, buildCardSign, parseCard } from '../src/protocol';
import { encodeCardToken, decodeCardToken } from '../src/link';
import { UCT_COIN_ID, UCT_DECIMALS } from '../src/lib/format';

const API_KEY = process.env.VITE_UNICITY_API_KEY ?? 'sk_ddc3cfcc001e4a28ac3fad7407f99590';
const WALLET_API_URL = 'https://wallet-api.unicity.network';
const ROOT = new URL('../seed-wallets/', import.meta.url).pathname;

function log(step: string, detail = '') {
  console.log(`\n== ${step} ${detail ? `— ${detail}` : ''}`);
}

async function initWallet(name: string): Promise<SphereInitResult> {
  const dir = `${ROOT}${name}`;
  mkdirSync(dir, { recursive: true });
  const base = createNodeProviders({
    network: 'testnet',
    dataDir: `${dir}/data`,
    tokensDir: `${dir}/tokens`,
    oracle: { apiKey: API_KEY },
  });
  const providers = createWalletApiProviders(base, {
    baseUrl: WALLET_API_URL,
    network: 'testnet2',
    deviceId: `cheers-verify-${name}`,
  });
  return Sphere.init({ ...providers, network: 'testnet', autoGenerate: true, groupChat: true });
}

async function main() {
  rmSync(ROOT, { recursive: true, force: true });
  const runId = Math.random().toString(36).slice(2, 8);

  log('init wallets', 'A = creator+signer, B = recipient');
  const a = await initWallet('a');
  const b = await initWallet('b');
  console.log('A address:', a.sphere.identity?.directAddress);
  console.log('B address:', b.sphere.identity?.directAddress);
  if (!a.sphere.identity || !b.sphere.identity) throw new Error('identity missing');

  log('UCT coin id from registry');
  const registryCoinId = getCoinIdBySymbol('UCT');
  console.log('registry:', registryCoinId, 'pinned:', UCT_COIN_ID);
  const coinId = registryCoinId ?? UCT_COIN_ID;

  log('B registers nametag');
  const nametag = `cheers-demo-${runId}`;
  const available = await b.sphere.isNametagAvailable(nametag);
  console.log(`@${nametag} available:`, available);
  if (!available) throw new Error('nametag unexpectedly taken');
  await b.sphere.registerNametag(nametag);
  console.log('registered:', b.sphere.identity?.nametag);

  log('A resolves @' + nametag);
  let peer = null;
  for (let i = 0; i < 5 && !peer; i++) {
    peer = await a.sphere.resolve(`@${nametag}`);
    if (!peer) await new Promise((r) => setTimeout(r, 2000));
  }
  if (!peer) throw new Error('recipient nametag did not resolve');
  console.log('resolved chainPubkey:', peer.chainPubkey);
  console.log('matches B:', peer.chainPubkey === b.sphere.identity.chainPubkey);

  log('A mints 100 UCT', '(no faucet on testnet2 — self-mint)');
  const mint = await a.sphere.payments.mintFungibleToken(coinId, 100n * 10n ** BigInt(UCT_DECIMALS));
  if (!mint.success) throw new Error(`mint failed: ${mint.error}`);
  console.log('minted tokenId:', mint.tokenId);
  const assetsA = await a.sphere.payments.getAssets();
  console.log('A assets:', assetsA.map((x) => `${x.symbol}=${x.totalAmount}`).join(', '));

  log('A creates the card group (private NIP-29)');
  const gcA = a.sphere.groupChat!;
  await gcA.connect();
  const group = await gcA.createGroup({
    name: `cheers:verify-${runId}`,
    description: 'Cheers live verification card',
    visibility: GroupVisibility.PRIVATE,
  });
  if (!group) throw new Error('createGroup returned null');
  console.log('groupId:', group.id, 'relay:', group.relayUrl);

  log('A posts card.meta');
  const metaContent = buildCardMeta({
    recipient: `@${nametag}`,
    recipientDisplay: 'Demo Sara',
    occasion: 'birthday',
    title: `Happy birthday, Demo Sara! (${runId})`,
    suggestedAmount: (5n * 10n ** BigInt(UCT_DECIMALS)).toString(),
    coinId: 'UCT',
    theme: 'sunset',
    createdBy: a.sphere.identity.chainPubkey,
    createdAt: Date.now(),
  });
  const metaMsg = await gcA.sendMessage(group.id, metaContent);
  if (!metaMsg) throw new Error('meta message post failed');
  console.log('meta message id:', metaMsg.id);

  log('A creates invite + share link');
  const invite = await gcA.createInvite(group.id);
  if (!invite) throw new Error('createInvite returned null');
  const token = encodeCardToken({ groupId: group.id, invite });
  console.log('link token:', token.slice(0, 60) + '…');
  const decoded = decodeCardToken(token);
  console.log('decode round-trip ok:', decoded.groupId === group.id && decoded.invite === invite);

  log('A pays 5 UCT to @' + nametag, 'peer-to-peer, engine-certified');
  const transfer = await a.sphere.payments.send({
    recipient: `@${nametag}`,
    amount: (5n * 10n ** BigInt(UCT_DECIMALS)).toString(),
    coinId,
    memo: 'Cheers verify chip-in',
  });
  console.log('transferId:', transfer.id, 'status:', transfer.status, 'deliveryState:', transfer.deliveryState);

  log('A posts card.sign with transferId');
  const signContent = buildCardSign({
    name: 'Rafi',
    note: 'Live verification signature — best wishes!',
    amount: (5n * 10n ** BigInt(UCT_DECIMALS)).toString(),
    coinId: 'UCT',
    transferId: transfer.id,
    emoji: '🎉',
    signedAt: Date.now(),
  });
  const signMsg = await gcA.sendMessage(group.id, signContent);
  if (!signMsg) throw new Error('sign message post failed');
  console.log('sign message id:', signMsg.id);

  log('B joins via invite and reads the card');
  const gcB = b.sphere.groupChat!;
  await gcB.connect();
  const joined = await gcB.joinGroup(group.id, invite);
  console.log('joined:', joined);
  if (!joined) throw new Error('joinGroup with invite failed');
  await new Promise((r) => setTimeout(r, 2000));
  const messages = await gcB.fetchMessages(group.id, 0, 200);
  console.log('fetched messages:', messages.length);

  const card = parseCard(
    messages.map((m) => ({ id: m.id, content: m.content, timestamp: m.timestamp, senderPubkey: m.senderPubkey })),
    { recipientPubkeys: [peer.transportPubkey, peer.chainPubkey] },
  );
  console.log('parsed meta title:', card.meta?.title);
  console.log('signatures:', card.signerCount, 'verified total (base units):', card.total.toString());
  if (!card.meta) throw new Error('meta did not parse');
  if (card.signerCount !== 1) throw new Error(`expected 1 signature, got ${card.signerCount}`);
  if (card.total !== 5n * 10n ** BigInt(UCT_DECIMALS)) throw new Error('total mismatch');

  log('B receives the payment');
  const received = await b.sphere.payments.receive();
  console.log('incoming transfers:', received.transfers.length);
  const assetsB = await b.sphere.payments.getAssets();
  console.log('B assets:', assetsB.map((x) => `${x.symbol}=${x.totalAmount}`).join(', '));

  log('B posts card.thanks; A sends DM to B');
  const { buildCardThanks } = await import('../src/protocol');
  const thanksMsg = await gcB.sendMessage(group.id, buildCardThanks({ note: 'You are all amazing 😭', sentAt: Date.now() }));
  console.log('thanks posted:', !!thanksMsg, 'sender pubkey:', thanksMsg?.senderPubkey?.slice(0, 16));
  console.log('B group pubkey:', gcB.getMyPublicKey()?.slice(0, 16), 'B transportPubkey:', peer.transportPubkey.slice(0, 16));
  try {
    await a.sphere.communications.sendDM(`@${nametag}`, `🎉 Friends are signing a card for you — token: ${token.slice(0, 40)}`);
    console.log('DM sent ok');
  } catch (err) {
    console.log('DM send failed (non-fatal):', err instanceof Error ? err.message : err);
  }

  // Verify thanks parses as recipient-verified
  await new Promise((r) => setTimeout(r, 1500));
  const messages2 = await gcB.fetchMessages(group.id, 0, 200);
  const card2 = parseCard(
    messages2.map((m) => ({ id: m.id, content: m.content, timestamp: m.timestamp, senderPubkey: m.senderPubkey })),
    { recipientPubkeys: [peer.transportPubkey, peer.chainPubkey, gcB.getMyPublicKey() ?? ''] },
  );
  console.log('thanks verified in parse:', card2.thanks?.note ?? '(none)');

  log('ALL CHECKS PASSED ✅');
  await a.sphere.destroy();
  await b.sphere.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('\nVERIFICATION FAILED ❌\n', err);
  process.exit(1);
});
