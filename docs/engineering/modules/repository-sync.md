---
id: mod-repository-sync
title: Repository & Sync Ports
status: living
implemented:
  - packages/domain/src/ports/subscription-repository.ts
  - packages/persistence/src/in-memory-subscription-repository.ts (in-memory adapter + contract test)
owner: nicola
updated: 2026-07-21
related: [adr-0002, adr-0003, mod-data-model]
---

# Repository & Sync Ports

## Repository port

```ts
interface Repository<T extends Entity> {
  get(id: string): Promise<T | null>;
  query(spec: QuerySpec<T>): Promise<T[]>;
  save(entity: T): Promise<void>; // upsert; bumps version + updatedAt
  softDelete(id: string): Promise<void>; // sets deletedAt; keeps row for sync
  transaction<R>(fn: (tx: RepoTx) => Promise<R>): Promise<R>;
}
```

- **Adapters:** `op-sqlite` (native) and WASM SQLite (web), both via Drizzle so the
  schema/types are shared. The port hides the two drivers from the domain (ADR 0003).
- Queries go through a small `QuerySpec` builder to keep raw SQL out of use cases.
- Soft delete + `version` make rows **mergeable** later without schema change.

## SyncProvider port

```ts
interface SyncProvider {
  status(): SyncStatus; // disabled | idle | syncing | error
  push(changes: ChangeSet): Promise<void>;
  pull(since: Cursor): Promise<ChangeSet>;
  resolve(conflict: Conflict): Resolution; // last-writer-wins by (version, updatedAt)
}
```

- **v1 adapter:** local no-op (`status = disabled`). No data leaves the device.
- **Later adapters (deferred, ADR 0007):**
  - **iCloud (CloudKit private DB)** — Apple only.
  - **Google Drive appDataFolder** — Android.
  - **First-party backend** — cross-platform; enables server-gated Pro (ADR 0011).
- **E2E encryption:** payloads encrypted client-side with libsodium
  (XChaCha20-Poly1305) under a **user-held key**; the provider only ever sees
  ciphertext (zero-knowledge, ADR 0002).

## Change tracking

- Every `save`/`softDelete` appends to a local `change_log` keyed by `(entity, id,
version)`. Sync ships the log; `Cursor` is the last-acked version vector.
- Conflict policy v1: **last-writer-wins** by `(version, updatedAt)`; the design leaves
  room to upgrade specific entities to CRDT merge (e.g. usage counts) later.

## Testing

- Repository **contract tests** run against both adapters (native via a test harness,
  web via WASM) to guarantee identical behaviour.
- Sync is tested against a **fake provider** simulating push/pull/conflict; encryption
  round-trips verified (ciphertext ≠ plaintext, decrypt(encrypt(x)) = x).
