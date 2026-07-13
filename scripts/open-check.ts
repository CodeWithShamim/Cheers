/** Simulate a fresh visitor opening a card link: decode → join → fetch → parse. */
import { mkdirSync, rmSync } from 'node:fs';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createNodeProviders } from '@unicitylabs/sphere-sdk/impl/nodejs';
import { createWalletApiProviders } from '@unicitylabs/sphere-sdk/impl/shared/wallet-api';
import { decodeCardToken, extractCardToken } from '../src/link';
import { parseCard } from '../src/protocol';
import { UCT_DECIMALS } from '../src/lib/format';

const API_KEY = process.env.VITE_UNICITY_API_KEY ?? 'sk_ddc3cfcc001e4a28ac3fad7407f99590';
const link = process.argv[2];
if (!link) throw new Error('usage: tsx scripts/open-check.ts <card link>');

const token = extractCardToken(link);
if (!token) throw new Error('no token in link');
const payload = decodeCardToken(token);
console.log('decoded:', payload);

const dir = new URL('../seed-wallets/visitor/', import.meta.url).pathname;
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const base = createNodeProviders({
  network: 'testnet',
  dataDir: `${dir}/data`,
  tokensDir: `${dir}/tokens`,
  oracle: { apiKey: API_KEY },
});
const providers = createWalletApiProviders(base, {
  baseUrl: 'https://wallet-api.unicity.network',
  network: 'testnet2',
  deviceId: 'cheers-open-check',
});
const { sphere } = await Sphere.init({ ...providers, network: 'testnet', autoGenerate: true, groupChat: true });
const gc = sphere.groupChat!;
await gc.connect();
const joined = await gc.joinGroup(payload.groupId, payload.invite);
console.log('fresh visitor joined:', joined);
const messages = await gc.fetchMessages(payload.groupId, 0, 200);
const card = parseCard(
  messages.map((m) => ({ id: m.id, content: m.content, timestamp: m.timestamp, senderPubkey: m.senderPubkey })),
);
console.log('title:', card.meta?.title);
console.log('signatures:', card.signerCount, '| verified total:', (card.total / 10n ** BigInt(UCT_DECIMALS)).toString(), 'UCT');
for (const s of card.signatures) console.log(` - ${s.emoji ?? ''} ${s.name}: "${s.note.slice(0, 40)}…" ${BigInt(s.amount) / 10n ** BigInt(UCT_DECIMALS)} UCT verified=${s.verified}`);
await sphere.destroy();
process.exit(0);
