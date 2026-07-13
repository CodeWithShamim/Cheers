/**
 * Cheers on-network protocol.
 *
 * A card is a private NIP-29 group; every piece of card state is a JSON
 * message inside that group. This module is PURE - no SDK imports, no I/O -
 * so it is fully unit-testable. It parses raw group messages defensively:
 * anything that isn't valid JSON of a known versioned type is ignored,
 * never a crash.
 */
import { z } from 'zod';

export const OCCASIONS = ['birthday', 'farewell', 'congrats', 'thanks', 'custom'] as const;
export type Occasion = (typeof OCCASIONS)[number];

/** Base-unit amount: decimal digit string (bigint-safe, never a float). */
const amountString = z.string().regex(/^\d+$/, 'amount must be a base-unit decimal string');

export const cardMetaSchema = z.object({
  v: z.literal(1),
  type: z.literal('card.meta'),
  recipient: z.string().regex(/^@[a-z0-9_+-]{1,36}$/, 'recipient must be an @nametag'),
  recipientDisplay: z.string().min(1).max(60),
  occasion: z.enum(OCCASIONS),
  title: z.string().min(1).max(120),
  suggestedAmount: amountString.optional(),
  coinId: z.string().min(1),
  theme: z.string().min(1),
  createdBy: z.string().min(1),
  createdAt: z.number().int().positive(),
});
export type CardMeta = z.infer<typeof cardMetaSchema>;

export const cardSignSchema = z.object({
  v: z.literal(1),
  type: z.literal('card.sign'),
  name: z.string().min(1).max(40),
  note: z.string().max(280),
  amount: amountString,
  coinId: z.string().min(1),
  /** On-network transfer id from payments.send - proof of the chip-in. Absent for amount "0". */
  transferId: z.string().min(1).optional(),
  emoji: z.string().max(8).optional(),
  signedAt: z.number().int().positive(),
});
export type CardSign = z.infer<typeof cardSignSchema>;

export const cardThanksSchema = z.object({
  v: z.literal(1),
  type: z.literal('card.thanks'),
  note: z.string().min(1).max(500),
  sentAt: z.number().int().positive(),
});
export type CardThanks = z.infer<typeof cardThanksSchema>;

/**
 * Minimal shape of a group message - structurally compatible with the SDK's
 * GroupMessageData, but declared here so this module stays SDK-free.
 */
export interface RawGroupMessage {
  id?: string;
  content: string;
  timestamp: number;
  senderPubkey: string;
}

export interface ParsedSignature extends CardSign {
  /** Group message id (dedupe key). */
  messageId: string;
  senderPubkey: string;
  timestamp: number;
  /** True when the chip-in carries a transferId (or amount is 0 - nothing to verify). */
  verified: boolean;
}

export interface ParsedThanks extends CardThanks {
  messageId: string;
  senderPubkey: string;
}

export interface ParsedCard {
  meta: CardMeta | null;
  signatures: ParsedSignature[];
  /** Recipient's thank-you note, only if its sender verifies as the recipient. */
  thanks: ParsedThanks | null;
  /** Sum of verified chip-in amounts (base units). */
  total: bigint;
  /** Sum of amounts claimed without a transferId (rendered as unverified, excluded from total). */
  unverifiedTotal: bigint;
  /** Number of distinct signatures (verified or not). */
  signerCount: number;
}

/** Parse one raw message into a typed protocol message, or null if not ours. */
export function parseProtocolMessage(
  content: string,
): CardMeta | CardSign | CardThanks | null {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    return null;
  }
  if (typeof json !== 'object' || json === null) return null;
  const type = (json as { type?: unknown }).type;
  if (type === 'card.meta') {
    const r = cardMetaSchema.safeParse(json);
    return r.success ? r.data : null;
  }
  if (type === 'card.sign') {
    const r = cardSignSchema.safeParse(json);
    return r.success ? r.data : null;
  }
  if (type === 'card.thanks') {
    const r = cardThanksSchema.safeParse(json);
    return r.success ? r.data : null;
  }
  return null;
}

export interface ParseCardOptions {
  /**
   * Pubkeys that verify a `card.thanks` as coming from the recipient
   * (e.g. resolved transport pubkey, chain pubkey - any normalized form).
   * Thanks from anyone else are ignored: without this, any group member
   * could impersonate the recipient.
   */
  recipientPubkeys?: string[];
}

/** Normalize pubkeys so 02/03-compressed and x-only hex forms compare equal. */
export function pubkeysEqual(a: string, b: string): boolean {
  const norm = (k: string) => {
    const lower = k.toLowerCase();
    return lower.length === 66 && (lower.startsWith('02') || lower.startsWith('03'))
      ? lower.slice(2)
      : lower;
  };
  return norm(a) === norm(b);
}

/**
 * Fold raw group messages into card state.
 *
 * Trust rules:
 * - Exactly one `card.meta` is trusted: the EARLIEST by timestamp (message id
 *   as tiebreak). Later imposter metas are ignored.
 * - `card.sign` with amount > 0 but no transferId is kept but flagged
 *   unverified and excluded from the verified total.
 * - Signatures are deduped by message id.
 * - `card.thanks` is only surfaced when its sender matches a recipient pubkey;
 *   latest one wins.
 */
export function parseCard(
  messages: RawGroupMessage[],
  options: ParseCardOptions = {},
): ParsedCard {
  const { recipientPubkeys = [] } = options;

  let meta: CardMeta | null = null;
  let metaTs = Infinity;
  let metaId = '';
  const signatures: ParsedSignature[] = [];
  const seenIds = new Set<string>();
  let thanks: ParsedThanks | null = null;

  for (const msg of messages) {
    const parsed = parseProtocolMessage(msg.content);
    if (!parsed) continue;
    const messageId = msg.id ?? `${msg.senderPubkey}:${msg.timestamp}:${msg.content.length}`;

    if (parsed.type === 'card.meta') {
      // earliest wins; id tiebreak makes the choice deterministic
      if (msg.timestamp < metaTs || (msg.timestamp === metaTs && messageId < metaId)) {
        meta = parsed;
        metaTs = msg.timestamp;
        metaId = messageId;
      }
    } else if (parsed.type === 'card.sign') {
      if (seenIds.has(messageId)) continue;
      seenIds.add(messageId);
      const amount = BigInt(parsed.amount);
      signatures.push({
        ...parsed,
        messageId,
        senderPubkey: msg.senderPubkey,
        timestamp: msg.timestamp,
        verified: amount === 0n || parsed.transferId !== undefined,
      });
    } else if (parsed.type === 'card.thanks') {
      const fromRecipient = recipientPubkeys.some((k) => pubkeysEqual(k, msg.senderPubkey));
      if (!fromRecipient) continue;
      if (!thanks || parsed.sentAt > thanks.sentAt) {
        thanks = { ...parsed, messageId, senderPubkey: msg.senderPubkey };
      }
    }
  }

  signatures.sort((a, b) => a.timestamp - b.timestamp || a.messageId.localeCompare(b.messageId));

  let total = 0n;
  let unverifiedTotal = 0n;
  for (const sig of signatures) {
    const amount = BigInt(sig.amount);
    if (sig.verified) total += amount;
    else unverifiedTotal += amount;
  }

  return { meta, signatures, thanks, total, unverifiedTotal, signerCount: signatures.length };
}

/** Serialize helpers - the single place message payloads are produced. */
export function buildCardMeta(meta: Omit<CardMeta, 'v' | 'type'>): string {
  return JSON.stringify(cardMetaSchema.parse({ v: 1, type: 'card.meta', ...meta }));
}

export function buildCardSign(sign: Omit<CardSign, 'v' | 'type'>): string {
  return JSON.stringify(cardSignSchema.parse({ v: 1, type: 'card.sign', ...sign }));
}

export function buildCardThanks(thanks: Omit<CardThanks, 'v' | 'type'>): string {
  return JSON.stringify(cardThanksSchema.parse({ v: 1, type: 'card.thanks', ...thanks }));
}
