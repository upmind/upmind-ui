/**
 * An executor's live-factory map, one entry per consumer-supplied manifest
 * key. `K` is never baked in here — the consumer's own manifest (an
 * as-const object plus its derived key union) supplies it, and every
 * `ComposableRegistry<K, …>` binding site fails to compile if a key is
 * missing or extraneous (item 4/4a — no manifest ships inside this package).
 */
export type ComposableRegistry<K extends string, T = unknown> = Record<
  K,
  () => T
>;
