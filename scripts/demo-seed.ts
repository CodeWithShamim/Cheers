/**
 * Demo card seeder (dev-only, Node).

 *
 * Run:  npm run seed
 * Env:  APP_ORIGIN (default http://localhost:5173) — origin used in the link
 *       VITE_UNICITY_API_KEY (defaults to the public testnet2 key)
 */
import { mkdirSync, rmSync } from "node:fs";
import {
  GroupVisibility,
  Sphere,
  getCoinIdBySymbol,
  type SphereInitResult,
} from "@unicitylabs/sphere-sdk";
import { createNodeProviders } from "@unicitylabs/sphere-sdk/impl/nodejs";
import { createWalletApiProviders } from "@unicitylabs/sphere-sdk/impl/shared/wallet-api";
import {
  buildCardMeta,
  buildCardSign,
  buildCardThanks,
  parseCard,
} from "../src/protocol";
import { buildCardUrl } from "../src/link";
import { UCT_COIN_ID, UCT_DECIMALS } from "../src/lib/format";

const API_KEY =
  process.env.VITE_UNICITY_API_KEY ?? "sk_ddc3cfcc001e4a28ac3fad7407f99590";
const WALLET_API_URL = "https://wallet-api.unicity.network";
const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:5173";
const ROOT = new URL("../seed-wallets/", import.meta.url).pathname;

const UCT = (n: bigint) => n * 10n ** BigInt(UCT_DECIMALS);

const SIGNERS: Array<{
  dir: string;
  name: string;
  note: string;
  emoji: string;
  uct: bigint;
}> = [
  {
    dir: "rafi",
    name: "Rafi",
    note: "Best boss ever. Don't go! The Tuesday standups won't be the same without your terrible puns.",
    emoji: "🎉",
    uct: 10n,
  },
  {
    dir: "priya",
    name: "Priya",
    note: "The kitchen will be so much quieter without your laugh. Come visit us — and bring the playlist.",
    emoji: "💐",
    uct: 5n,
  },
  {
    dir: "tom",
    name: "Tom",
    note: "To the next adventure! 🚀 You taught me half of what I know and made the other half fun.",
    emoji: "🥂",
    uct: 25n,
  },
];

async function initWallet(name: string): Promise<SphereInitResult> {
  const dir = `${ROOT}${name}`;
  mkdirSync(dir, { recursive: true });
  const base = createNodeProviders({
    network: "testnet",
    dataDir: `${dir}/data`,
    tokensDir: `${dir}/tokens`,
    oracle: { apiKey: API_KEY },
  });
  const providers = createWalletApiProviders(base, {
    baseUrl: WALLET_API_URL,
    network: "testnet2",
    deviceId: `cheers-seed-${name}`,
  });
  return Sphere.init({
    ...providers,
    network: "testnet",
    autoGenerate: true,
    groupChat: true,
  });
}

async function main() {
  rmSync(ROOT, { recursive: true, force: true });
  const runId = Math.random().toString(36).slice(2, 8);
  const coinId = getCoinIdBySymbol("UCT") ?? UCT_COIN_ID;

  console.log("→ Recipient wallet (Sara)…");
  const sara = await initWallet("sara");
  const nametag = `sara-${runId}`;
  await sara.sphere.registerNametag(nametag);
  console.log(`  @${nametag} — ${sara.sphere.identity?.directAddress}`);
  console.log(
    `  recovery phrase (to open the card AS the recipient): ${sara.sphere.getMnemonic()}`,
  );

  console.log("→ Creator wallet…");
  const creator = await initWallet("creator");
  const gc = creator.sphere.groupChat!;
  await gc.connect();
  const group = await gc.createGroup({
    name: `cheers:farewell-sara-${runId}`,
    description: `Cheers card for @${nametag}`,
    visibility: GroupVisibility.PRIVATE,
  });
  if (!group) throw new Error("createGroup failed");

  await gc.sendMessage(
    group.id,
    buildCardMeta({
      recipient: `@${nametag}`,
      recipientDisplay: "Sara",
      occasion: "farewell",
      title: "Farewell, Sara — we'll miss you!",
      suggestedAmount: UCT(5n).toString(),
      coinId: "UCT",
      theme: "sunset",
      createdBy: creator.sphere.identity!.chainPubkey,
      createdAt: Date.now(),
    }),
  );
  const invite = await gc.createInvite(group.id);
  if (!invite) throw new Error("createInvite failed");
  const url = buildCardUrl(APP_ORIGIN, { groupId: group.id, invite });
  console.log(`  card group: ${group.id}`);

  for (const signer of SIGNERS) {
    console.log(
      `→ Signer ${signer.name}: mint ${signer.uct + 5n} UCT, pay ${signer.uct} UCT, sign…`,
    );
    const w = await initWallet(signer.dir);
    const mint = await w.sphere.payments.mintFungibleToken(
      coinId,
      UCT(signer.uct + 5n),
    );
    if (!mint.success)
      throw new Error(`mint failed for ${signer.name}: ${mint.error}`);
    const transfer = await w.sphere.payments.send({
      recipient: `@${nametag}`,
      amount: UCT(signer.uct).toString(),
      coinId,
      memo: `Cheers: Farewell, Sara!`,
    });
    const wgc = w.sphere.groupChat!;
    await wgc.connect();
    const joined = await wgc.joinGroup(group.id, invite);
    if (!joined) throw new Error(`${signer.name} could not join the group`);
    const posted = await wgc.sendMessage(
      group.id,
      buildCardSign({
        name: signer.name,
        note: signer.note,
        amount: UCT(signer.uct).toString(),
        coinId: "UCT",
        transferId: transfer.id,
        emoji: signer.emoji,
        signedAt: Date.now(),
      }),
    );
    if (!posted) throw new Error(`${signer.name} sign post failed`);
    console.log(`  ✓ transfer ${transfer.id} (${transfer.status})`);
    await w.sphere.destroy();
  }

  console.log("→ Sara opens the card, receives gifts, says thanks…");
  const sgc = sara.sphere.groupChat!;
  await sgc.connect();
  await sgc.joinGroup(group.id, invite);
  await sara.sphere.payments.receive();
  await sgc.sendMessage(
    group.id,
    buildCardThanks({
      note: "You're all amazing 😭 Keep the Tuesday puns alive without me!",
      sentAt: Date.now(),
    }),
  );
  await new Promise((r) => setTimeout(r, 1500));
  const messages = await sgc.fetchMessages(group.id, 0, 200);
  const card = parseCard(
    messages.map((m) => ({
      id: m.id,
      content: m.content,
      timestamp: m.timestamp,
      senderPubkey: m.senderPubkey,
    })),
  );
  const assets = await sara.sphere.payments.getAssets();

  console.log("\n──────────────────────────────────────────────");
  console.log("DEMO CARD READY");
  console.log(`  title:      ${card.meta?.title}`);
  console.log(`  signatures: ${card.signerCount}`);
  console.log(
    `  total:      ${card.total / 10n ** BigInt(UCT_DECIMALS)} UCT (verified, on-network)`,
  );
  console.log(
    `  Sara's balance: ${assets.map((a) => `${a.symbol}=${BigInt(a.totalAmount) / 10n ** BigInt(UCT_DECIMALS)}`).join(", ")}`,
  );
  console.log(`\n  OPEN THE CARD:\n  ${url}\n`);
  console.log("──────────────────────────────────────────────");

  await creator.sphere.destroy();
  await sara.sphere.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
