/**
 * Device-local index of cards this browser has touched. By design this is
 * NOT synced anywhere: the cards themselves live on-network (the group IS
 * the card); this is just a convenience list of links.
 */
import type { Occasion } from '../protocol';

export type CardRole = 'created' | 'signed' | 'received';

export interface MyCardEntry {
  /** Full share link (the app can reopen the card from this alone). */
  link: string;
  groupId: string;
  role: CardRole;
  title: string;
  occasion: Occasion;
  recipientDisplay: string;
  theme: string;
  lastOpened: number;
}

const KEY = 'cheers_my_cards';

export function listMyCards(): MyCardEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return (parsed as MyCardEntry[]).sort((a, b) => b.lastOpened - a.lastOpened);
  } catch {
    return [];
  }
}

/**
 * Insert or update by groupId. Role upgrades only (received > created > signed
 * priority is not meaningful — instead: never downgrade 'created'/'received'
 * to 'signed', since the stronger relationship is the interesting one).
 */
export function rememberCard(entry: Omit<MyCardEntry, 'lastOpened'>): void {
  const all = listMyCards();
  const existing = all.find((c) => c.groupId === entry.groupId);
  const rolePriority: Record<CardRole, number> = { signed: 1, created: 2, received: 3 };
  const role =
    existing && rolePriority[existing.role] > rolePriority[entry.role]
      ? existing.role
      : entry.role;
  const next = [
    { ...entry, role, lastOpened: Date.now() },
    ...all.filter((c) => c.groupId !== entry.groupId),
  ];
  localStorage.setItem(KEY, JSON.stringify(next.slice(0, 200)));
}

export function forgetCard(groupId: string): void {
  localStorage.setItem(
    KEY,
    JSON.stringify(listMyCards().filter((c) => c.groupId !== groupId)),
  );
}
