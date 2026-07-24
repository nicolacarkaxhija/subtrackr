import { describe, expect, it } from 'vitest';
import { InMemoryKeyValueStore } from './in-memory-key-value-store';

describe('InMemoryKeyValueStore', () => {
  it('returns null for an absent key', async () => {
    expect(await new InMemoryKeyValueStore().get('missing')).toBeNull();
  });

  it('stores and reads a value', async () => {
    const store = new InMemoryKeyValueStore();
    await store.set('k', 'v');
    expect(await store.get('k')).toBe('v');
  });

  it('overwrites an existing value', async () => {
    const store = new InMemoryKeyValueStore();
    await store.set('k', 'v1');
    await store.set('k', 'v2');
    expect(await store.get('k')).toBe('v2');
  });

  it('removes a value', async () => {
    const store = new InMemoryKeyValueStore();
    await store.set('k', 'v');
    await store.remove('k');
    expect(await store.get('k')).toBeNull();
  });

  it('ignores removing an absent key', async () => {
    const store = new InMemoryKeyValueStore();
    await expect(store.remove('missing')).resolves.toBeUndefined();
  });
});
