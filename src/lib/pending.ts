/**
 * Pending-signature safety net.
 *
 * Paying and posting the signature are two separate network actions (pay
 * first, post second - deliberately non-atomic). If the payment succeeded but
 * posting the card.sign message failed, we persist the fully-built signature
 * here and retry POSTING ONLY on next load. We never re-pay: the transferId
 * in the record proves the payment already happened.
 *
 * Storage is injected so this logic is unit-testable without a browser.
 */

export interface PendingSignature {
  /** Card group to post into. */
  groupId: string;
  /**
   * Invite code, in case the group needs re-joining before posting. Absent
   * when the source link carried none (the wallet is already a member, so
   * re-joining needs no code).
   */
  invite?: string;
  /** The exact card.sign JSON string that failed to post. */
  content: string;
  /** TransferId of the already-completed payment (never re-pay). */
  transferId?: string;
  createdAt: number;
  attempts: number;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = 'cheers_pending_signatures';
const MAX_ATTEMPTS = 20;

export class PendingSignatureStore {
  constructor(private readonly storage: KeyValueStorage) {}

  list(): PendingSignature[] {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PendingSignature[]) : [];
    } catch {
      return [];
    }
  }

  add(pending: Omit<PendingSignature, 'createdAt' | 'attempts'>): void {
    const all = this.list();
    // Same content for the same group is the same failed post - don't duplicate.
    if (all.some((p) => p.groupId === pending.groupId && p.content === pending.content)) return;
    all.push({ ...pending, createdAt: Date.now(), attempts: 0 });
    this.save(all);
  }

  /**
   * Retry every pending post via `post`. Successful (or permanently exhausted)
   * records are removed; failures stay with an incremented attempt count.
   * Returns how many were successfully posted.
   */
  async retryAll(
    post: (pending: PendingSignature) => Promise<void>,
  ): Promise<{ posted: number; remaining: number }> {
    const all = this.list();
    if (all.length === 0) return { posted: 0, remaining: 0 };

    const remaining: PendingSignature[] = [];
    let posted = 0;
    for (const pending of all) {
      try {
        await post(pending);
        posted++;
      } catch {
        const attempts = pending.attempts + 1;
        if (attempts < MAX_ATTEMPTS) remaining.push({ ...pending, attempts });
        // else: drop it - poisoned records must not retry forever
      }
    }
    this.save(remaining);
    return { posted, remaining: remaining.length };
  }

  clear(): void {
    this.storage.removeItem(STORAGE_KEY);
  }

  private save(all: PendingSignature[]): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}
