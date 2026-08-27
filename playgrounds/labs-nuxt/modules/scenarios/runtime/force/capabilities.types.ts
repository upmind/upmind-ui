/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-27, 22914 nodes) — no
 * `CorpusCapabilities` / `availablePresets` / corpus-capability node exists
 * anywhere in the tree (the only `capability` hits are
 * `list-surface.capability-gate.spec` wrappers, an unrelated surface concern),
 * so this contract is minted rather than consumed. What it does NOT mint: the
 * preset vocabulary is `useForcedState`'s own `ForceUrlPreset` and a recording
 * is `corpus.source.types`' own `RecordedFixture`, both consumed whole.
 * See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/capabilities.types
 * @description What a module's OWN corpus can honestly answer — the contract
 * `capabilities.ts` derives by measuring recordings, never by naming fixtures.
 */

import type { RecordedFixture } from "./corpus.source.types";

// -----------------------------------------------------------------------------

/**
 * Which forced states a module's recordings can be served from. Every field is
 * a measurement of the corpus — a `request.method` and a `response.status` —
 * so a module offering a preset it cannot answer is a derivation defect rather
 * than a stale list somebody forgot to edit.
 */
export type CorpusCapabilities = {
  /** A successful collection read is recorded, so there are rows to remove. */
  canEmpty: boolean;
  /** Any recording exists at all — a withheld answer needs no body. */
  canLoading: boolean;
  /** A read is recorded, so there is a read for a failure to be aimed at. */
  canErrorCollection: boolean;
  /** A FAILING WRITE is recorded. Nothing is authored to fake one. */
  canErrorAction: boolean;
  /**
   * The module's own failing recording, the one both error presets are served
   * from. Absent when the corpus holds no failure — which is what makes
   * `canErrorCollection` false too.
   */
  failure?: RecordedFixture;
};
