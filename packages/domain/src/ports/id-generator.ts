/**
 * Source of new unique identifiers, injected so the domain/application layers never
 * call a platform RNG directly (keeps them pure and deterministic in tests). The
 * production adapter yields sortable UUIDv7s; tests supply a deterministic sequence.
 */
export interface IdGenerator {
  /** A fresh, unique identifier. */
  next(): string;
}
