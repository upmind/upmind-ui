// -----------------------------------------------------------------------------
/**
 * @module registry/registry.types
 * @description The registry type a consumer supplies to map its own manifest
 * keys to live factories.
 */

/**
 * An executor's live-factory map, one entry per consumer-supplied manifest
 * key. `K` is never baked in here — the consumer's own manifest (an
 * as-const object plus its derived key union) supplies it, and every
 * `ScenarioRegistry<K, …>` binding site fails to compile if a key is
 * missing or extraneous (item 4/4a — no manifest ships inside this package).
 */
export type ScenarioRegistry<K extends string, T = unknown> = Record<
  K,
  () => T
>;
