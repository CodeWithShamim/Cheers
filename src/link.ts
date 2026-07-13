/**
 * Card share-link codec.
 *
 * The payload rides the URL HASH fragment (`/c/#<base64url(json)>`) so the
 * group id + invite code never appear in any server log — the app is a static
 * SPA and the fragment never leaves the browser.
 *
 * Pure module: no SDK, no window access in encode/decode.
 */
import { z } from 'zod';

export const cardLinkPayloadSchema = z.object({
  v: z.literal(1),
  /** NIP-29 group id. */
  groupId: z.string().min(1),
  /** Invite code for the private group. */
  invite: z.string().min(1),
  /** Optional relay override (ws:// or wss:// URL). */
  relay: z.string().url().optional(),
});
export type CardLinkPayload = z.infer<typeof cardLinkPayloadSchema>;

export class InvalidCardLinkError extends Error {
  constructor(message = 'This card link is invalid or has expired.') {
    super(message);
    this.name = 'InvalidCardLinkError';
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  // btoa exists in browsers and Node >= 16
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encode a card payload to the hash-fragment token. */
export function encodeCardToken(payload: Omit<CardLinkPayload, 'v'>): string {
  const validated = cardLinkPayloadSchema.parse({ v: 1, ...payload });
  return toBase64Url(new TextEncoder().encode(JSON.stringify(validated)));
}

/** Decode a hash-fragment token back to a payload. Throws InvalidCardLinkError. */
export function decodeCardToken(token: string): CardLinkPayload {
  const trimmed = token.trim().replace(/^#/, '');
  if (!trimmed) throw new InvalidCardLinkError();
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder().decode(fromBase64Url(trimmed)));
  } catch {
    throw new InvalidCardLinkError();
  }
  const result = cardLinkPayloadSchema.safeParse(json);
  if (!result.success) throw new InvalidCardLinkError();
  return result.data;
}

/** Build a full shareable URL for a card. `origin` example: https://cheers.app */
export function buildCardUrl(origin: string, payload: Omit<CardLinkPayload, 'v'>): string {
  return `${origin.replace(/\/$/, '')}/c/#${encodeCardToken(payload)}`;
}

/**
 * Extract the token from any pasted form: a full URL, a `/c/#...` path, or a
 * bare token. Returns null when nothing card-shaped is found.
 */
export function extractCardToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const hashIndex = trimmed.indexOf('#');
  const candidate = hashIndex >= 0 ? trimmed.slice(hashIndex + 1) : trimmed;
  return candidate || null;
}
