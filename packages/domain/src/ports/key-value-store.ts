/**
 * Minimal async key/value persistence port. Platform adapters implement it (web
 * localStorage or IndexedDB, native SQLite or AsyncStorage) so repositories stay free
 * of storage detail. Values are opaque strings; callers own serialization.
 */
export interface KeyValueStore {
  /** The stored value for `key`, or null if absent. */
  get(key: string): Promise<string | null>;
  /** Store `value` under `key`, overwriting any existing value. */
  set(key: string, value: string): Promise<void>;
  /** Remove `key`. A no-op if it does not exist. */
  remove(key: string): Promise<void>;
}
