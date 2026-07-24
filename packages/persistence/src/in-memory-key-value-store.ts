import type { KeyValueStore } from '@subtrackr/domain';

/** In-memory {@link KeyValueStore} for tests and as a default fallback. */
export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly entries = new Map<string, string>();

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.entries.get(key) ?? null);
  }

  set(key: string, value: string): Promise<void> {
    this.entries.set(key, value);
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    this.entries.delete(key);
    return Promise.resolve();
  }
}
