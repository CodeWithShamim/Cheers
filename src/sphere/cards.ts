/**
 * Card operations - the bridge between the pure protocol/link modules and
 * the live network. A card IS a private NIP-29 group: creating, opening,
 * signing and thanking are all group-message operations; the chip-in itself
 * is a direct peer-to-peer payment (never pooled, never custodied).
 */
import { GroupVisibility, type GroupMessageData, type PeerInfo } from '@unicitylabs/sphere-sdk';
import type { GroupChatModule } from '@unicitylabs/sphere-sdk';
import {
  buildCardMeta,
  buildCardSign,
  buildCardThanks,
  parseCard,
  pubkeysEqual,
  type CardMeta,
  type Occasion,
  type ParsedCard,
} from '../protocol';
import { buildCardUrl, InvalidCardLinkError, type CardLinkPayload } from '../link';
import { UCT_SYMBOL } from '../lib/amounts';
import { isPaymentIndeterminate } from '../lib/errors';
import { PendingSignatureStore } from '../lib/pending';
import { rememberCard, type CardRole } from '../lib/mycards';
import { getSphere } from './client';
import { resolvePeer, uctCoinId } from './wallet';

const pendingStore = new PendingSignatureStore(localStorage);

async function getGroupChat(): Promise<GroupChatModule> {
  const sphere = await getSphere();
  const gc = sphere.groupChat;
  if (!gc) throw new Error('Group chat module is not enabled.');
  if (!gc.getConnectionStatus()) await gc.connect();
  return gc;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return `${base || 'card'}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreateCardInput {
  recipient: string; // '@sara'
  recipientDisplay: string;
  occasion: Occasion;
  title: string;
  suggestedAmount?: bigint;
  theme: string;
}

export interface CreatedCard {
  groupId: string;
  invite: string;
  url: string;
  /** Whether the heads-up DM to the recipient was delivered. */
  dmSent: boolean;
}

export async function createCard(input: CreateCardInput): Promise<CreatedCard> {
  const sphere = await getSphere();
  const recipient = `@${input.recipient.trim().toLowerCase().replace(/^@/, '')}`;

  // The recipient must resolve BEFORE we create anything: money goes straight
  // to their wallet, so an unresolvable nametag would make an unsignable card.
  const peer = await resolvePeer(recipient);
  if (!peer) {
    throw new Error(
      `${recipient} doesn't exist on the network yet. Ask them to register the nametag in their wallet first.`,
    );
  }

  const gc = await getGroupChat();
  const group = await gc.createGroup({
    name: `cheers:${slugify(input.title)}`,
    description: `Cheers card for ${recipient}`,
    visibility: GroupVisibility.PRIVATE,
  });
  if (!group) throw new Error('The relay refused to create the card group. Try again.');

  const metaContent = buildCardMeta({
    recipient,
    recipientDisplay: input.recipientDisplay.trim(),
    occasion: input.occasion,
    title: input.title.trim(),
    ...(input.suggestedAmount !== undefined && input.suggestedAmount > 0n
      ? { suggestedAmount: input.suggestedAmount.toString() }
      : {}),
    coinId: UCT_SYMBOL,
    theme: input.theme,
    createdBy: sphere.identity?.chainPubkey ?? 'unknown',
    createdAt: Date.now(),
  });
  const posted = await gc.sendMessage(group.id, metaContent);
  if (!posted) {
    throw new Error('Could not write the card metadata to the relay. Try again.');
  }

  const invite = await gc.createInvite(group.id);
  if (!invite) throw new Error('Could not create an invite for the card. Try again.');

  const url = buildCardUrl(window.location.origin, { groupId: group.id, invite });

  rememberCard({
    link: url,
    groupId: group.id,
    role: 'created',
    title: input.title.trim(),
    occasion: input.occasion,
    recipientDisplay: input.recipientDisplay.trim(),
    theme: input.theme,
  });

  // Heads-up DM to the recipient - best-effort: the link is shown regardless.
  let dmSent = false;
  try {
    await sphere.communications.sendDM(
      recipient,
      `🎉 Friends are signing a card for you - open it here: ${url}`,
    );
    dmSent = true;
  } catch {
    dmSent = false;
  }

  return { groupId: group.id, invite, url, dmSent };
}

export interface OpenedCard {
  payload: CardLinkPayload;
  card: ParsedCard;
  /** Resolved network identity of the recipient (null if unresolvable). */
  recipientPeer: PeerInfo | null;
  /** True when the connected wallet IS the recipient. */
  isRecipient: boolean;
  /** This viewer's group-chat pubkey (to spot their own notes on the wall). */
  myPubkey: string | null;
}

function toRawMessages(messages: GroupMessageData[]) {
  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    timestamp: m.timestamp,
    senderPubkey: m.senderPubkey,
  }));
}

/** Fetch a group's messages and merge them with the module cache, deduped by id. */
async function loadGroupMessages(
  gc: GroupChatModule,
  groupId: string,
): Promise<GroupMessageData[]> {
  const fetched = await gc.fetchMessages(groupId, 0, 500);
  const cached = gc.getMessages(groupId);
  const byId = new Map<string, GroupMessageData>();
  for (const m of [...cached, ...fetched]) byId.set(m.id ?? `${m.senderPubkey}:${m.timestamp}`, m);
  return [...byId.values()];
}

/** Pubkeys that count as "the recipient" for thanks-verification. */
function recipientKeys(peer: PeerInfo | null): string[] {
  if (!peer) return [];
  return [peer.transportPubkey, peer.chainPubkey].filter(Boolean);
}

export async function openCard(payload: CardLinkPayload): Promise<OpenedCard> {
  const sphere = await getSphere();
  const gc = await getGroupChat();

  const joined = await gc.joinGroup(payload.groupId, payload.invite);
  if (!joined) {
    throw new InvalidCardLinkError(
      'This card link is invalid or its invite has expired - ask for a fresh link.',
    );
  }

  const messages = await loadGroupMessages(gc, payload.groupId);

  // First parse without recipient verification just to learn who the card is for.
  const draft = parseCard(toRawMessages(messages));
  const recipientPeer = draft.meta ? await resolvePeer(draft.meta.recipient) : null;
  const card = parseCard(toRawMessages(messages), {
    recipientPubkeys: recipientKeys(recipientPeer),
  });

  const myChainPubkey = sphere.identity?.chainPubkey ?? null;
  const isRecipient =
    recipientPeer !== null &&
    myChainPubkey !== null &&
    recipientPeer.chainPubkey === myChainPubkey;

  if (card.meta) {
    rememberCard({
      link: buildCardUrl(window.location.origin, {
        groupId: payload.groupId,
        invite: payload.invite,
        ...(payload.relay ? { relay: payload.relay } : {}),
      }),
      groupId: payload.groupId,
      role: isRecipient ? 'received' : 'signed',
      title: card.meta.title,
      occasion: card.meta.occasion,
      recipientDisplay: card.meta.recipientDisplay,
      theme: card.meta.theme,
    });
  }

  return {
    payload,
    card,
    recipientPeer,
    isRecipient,
    myPubkey: gc.getMyPublicKey(),
  };
}

/**
 * Classify this wallet's relationship to a card from its meta and our identity
 * - no network round-trip. Falls back to 'signed' (the weakest role) when we
 * are neither the creator nor the named recipient.
 */
function roleForMeta(
  meta: CardMeta,
  myChainPubkey: string | null,
  myNametag: string | null,
): CardRole {
  if (myChainPubkey && pubkeysEqual(meta.createdBy, myChainPubkey)) return 'created';
  if (myNametag && meta.recipient.toLowerCase() === `@${myNametag.toLowerCase()}`) return 'received';
  return 'signed';
}

/**
 * Rebuild the device-local My Cards index from the wallet's on-network group
 * memberships. Runs once after the wallet is ready so cards reappear after a
 * logout + restore: the local list is wiped on logout, but the groups (each
 * card IS a `cheers:`-named private group) are recovered from the network by
 * the SDK. For each such group we fold its messages into card meta, classify
 * our role from identity, and re-remember it.
 *
 * The rebuilt link carries no invite code - openCard's joinGroup succeeds
 * without one for a group we are already a member of. Best-effort: a group we
 * cannot read is skipped rather than failing the whole rebuild.
 *
 * Returns the number of cards restored.
 */
export async function rebuildMyCardsFromNetwork(): Promise<number> {
  const sphere = await getSphere();
  const gc = await getGroupChat();
  const myChainPubkey = sphere.identity?.chainPubkey ?? null;
  const myNametag = sphere.identity?.nametag ?? null;

  const groups = gc.getGroups().filter((g) => g.name.startsWith('cheers:'));
  let restored = 0;
  for (const group of groups) {
    try {
      const card = parseCard(toRawMessages(await loadGroupMessages(gc, group.id)));
      if (!card.meta) continue;
      const meta = card.meta;
      rememberCard({
        link: buildCardUrl(window.location.origin, { groupId: group.id }),
        groupId: group.id,
        role: roleForMeta(meta, myChainPubkey, myNametag),
        title: meta.title,
        occasion: meta.occasion,
        recipientDisplay: meta.recipientDisplay,
        theme: meta.theme,
      });
      restored++;
    } catch {
      // Skip a group we can't read; the rest of the rebuild still proceeds.
    }
  }
  return restored;
}

/**
 * Re-parse the card from the module's live message cache - used after
 * onMessage events to produce a fresh ParsedCard cheaply (no relay round-trip).
 */
export async function reparseCard(
  groupId: string,
  recipientPeer: PeerInfo | null,
): Promise<ParsedCard> {
  const gc = await getGroupChat();
  return parseCard(toRawMessages(gc.getMessages(groupId)), {
    recipientPubkeys: recipientKeys(recipientPeer),
  });
}

/** Live subscription. Returns unsubscribe. */
export async function watchCard(
  groupId: string,
  onEvent: (message: GroupMessageData) => void,
): Promise<() => void> {
  const gc = await getGroupChat();
  return gc.onMessage((message) => {
    if (message.groupId === groupId) onEvent(message);
  });
}

export type SignStage = 'paying' | 'posting' | 'done';

export interface SignCardInput {
  payload: CardLinkPayload;
  meta: CardMeta;
  name: string;
  note: string;
  emoji?: string;
  /** Base units. 0n = just sign, no gift. */
  amount: bigint;
  onStage?: (stage: SignStage) => void;
}

export interface SignCardResult {
  transferId?: string;
  /** True when the payment may have gone through but confirmation is pending. */
  paymentIndeterminate: boolean;
  /** True when the card.sign post failed and was queued for retry. */
  postQueued: boolean;
}

/**
 * Pay-then-post. Deliberately non-atomic (two networks):
 *  1. payments.send → transferId  (money moves signer → recipient, P2P)
 *  2. sendMessage(card.sign incl. transferId)
 * If (2) fails after (1) succeeded, the signature is queued in localStorage
 * and re-POSTED on next load. The payment is NEVER retried here.
 */
export async function signCard(input: SignCardInput): Promise<SignCardResult> {
  const sphere = await getSphere();
  const { payload, meta } = input;

  let transferId: string | undefined;
  let paymentIndeterminate = false;

  if (input.amount > 0n) {
    input.onStage?.('paying');
    try {
      const result = await sphere.payments.send({
        recipient: meta.recipient,
        amount: input.amount.toString(),
        coinId: uctCoinId(),
        memo: `Cheers: ${meta.title}`,
      });
      transferId = result.id;
    } catch (err) {
      if (isPaymentIndeterminate(err)) {
        // The spend may already be certified on-chain. NEVER re-send - the SDK
        // resumes the open intent under the same transferId. We post the
        // signature without a transferId (renders as "unverified").
        paymentIndeterminate = true;
      } else {
        throw err;
      }
    }
  }

  input.onStage?.('posting');
  const content = buildCardSign({
    name: input.name.trim(),
    note: input.note.trim(),
    amount: input.amount.toString(),
    coinId: UCT_SYMBOL,
    ...(transferId ? { transferId } : {}),
    ...(input.emoji ? { emoji: input.emoji } : {}),
    signedAt: Date.now(),
  });

  let postQueued = false;
  try {
    const gc = await getGroupChat();
    const posted = await gc.sendMessage(payload.groupId, content);
    if (!posted) throw new Error('relay refused message');
  } catch {
    // Money (if any) already moved - queue the post, never the payment.
    pendingStore.add({
      groupId: payload.groupId,
      ...(payload.invite ? { invite: payload.invite } : {}),
      content,
      ...(transferId ? { transferId } : {}),
    });
    postQueued = true;
  }

  if (input.amount > 0n) {
    rememberCard({
      link: buildCardUrl(window.location.origin, {
        groupId: payload.groupId,
        invite: payload.invite,
      }),
      groupId: payload.groupId,
      role: 'signed',
      title: meta.title,
      occasion: meta.occasion,
      recipientDisplay: meta.recipientDisplay,
      theme: meta.theme,
    });
  }

  input.onStage?.('done');
  return { ...(transferId ? { transferId } : {}), paymentIndeterminate, postQueued };
}

/** Recipient-only thank-you note (verification happens parse-side). */
export async function sendThanks(groupId: string, note: string): Promise<void> {
  const gc = await getGroupChat();
  const posted = await gc.sendMessage(groupId, buildCardThanks({ note: note.trim(), sentAt: Date.now() }));
  if (!posted) throw new Error('Could not post your thank-you note. Try again.');
}

/**
 * Retry posting any signatures whose payment succeeded but whose card.sign
 * post failed. Called once on app start (after the wallet is ready).
 */
export async function retryPendingSignatures(): Promise<number> {
  if (pendingStore.list().length === 0) return 0;
  const gc = await getGroupChat();
  const { posted } = await pendingStore.retryAll(async (pending) => {
    await gc.joinGroup(pending.groupId, pending.invite);
    const ok = await gc.sendMessage(pending.groupId, pending.content);
    if (!ok) throw new Error('relay refused message');
  });
  return posted;
}
