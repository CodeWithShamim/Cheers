import { describe, expect, it, vi } from 'vitest';
import { PendingSignatureStore, type KeyValueStorage } from '../src/lib/pending';

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const record = {
  groupId: 'group-1',
  invite: 'inv-1',
  content: '{"v":1,"type":"card.sign","transferId":"tx-9"}',
  transferId: 'tx-9',
};

describe('PendingSignatureStore', () => {
  it('persists and lists pending signatures', () => {
    const store = new PendingSignatureStore(memoryStorage());
    store.add(record);
    const all = store.list();
    expect(all).toHaveLength(1);
    expect(all[0]?.transferId).toBe('tx-9');
    expect(all[0]?.attempts).toBe(0);
  });

  it('does not duplicate the same failed post', () => {
    const store = new PendingSignatureStore(memoryStorage());
    store.add(record);
    store.add(record);
    expect(store.list()).toHaveLength(1);
  });

  it('removes records after a successful retry post — never re-pays', async () => {
    const store = new PendingSignatureStore(memoryStorage());
    store.add(record);
    const post = vi.fn().mockResolvedValue(undefined);
    const result = await store.retryAll(post);
    expect(post).toHaveBeenCalledTimes(1);
    // The retry only re-POSTS the existing content with the original transferId
    expect(post.mock.calls[0]![0].transferId).toBe('tx-9');
    expect(result).toEqual({ posted: 1, remaining: 0 });
    expect(store.list()).toHaveLength(0);
  });

  it('keeps failed retries with incremented attempts', async () => {
    const store = new PendingSignatureStore(memoryStorage());
    store.add(record);
    const result = await store.retryAll(vi.fn().mockRejectedValue(new Error('relay down')));
    expect(result).toEqual({ posted: 0, remaining: 1 });
    expect(store.list()[0]?.attempts).toBe(1);
  });

  it('retries a mix independently', async () => {
    const store = new PendingSignatureStore(memoryStorage());
    store.add(record);
    store.add({ ...record, groupId: 'group-2', content: '{"other":true}' });
    const post = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('nope'));
    const result = await store.retryAll(post);
    expect(result).toEqual({ posted: 1, remaining: 1 });
  });

  it('survives corrupted storage', () => {
    const storage = memoryStorage();
    storage.setItem('cheers_pending_signatures', '{corrupted');
    const store = new PendingSignatureStore(storage);
    expect(store.list()).toEqual([]);
  });
});
