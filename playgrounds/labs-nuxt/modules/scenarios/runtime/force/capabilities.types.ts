/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-27, re-queried) —
 * `CorpusCapabilities` (L28, community 446) and `corpusCapabilities()`
 * (`capabilities.ts` L75) are THIS module's own pair; no competing
 * corpus-capability contract exists in the tree (the only other `capability`
 * hits are `list-surface-capability-gate.spec` wrappers, an unrelated surface
 * concern). Nothing new is minted here — the preset vocabulary stays
 * `useForcedState`'s `ForceUrlPreset` (L38) and a recording stays
 * `corpus.source.types`' `RecordedFixture` (L30), both consumed whole.
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
 * What EVIDENCE a module's recordings hold. Every field is a measurement of the
 * corpus — a `request.method` and a `response.status` — never a statement of
 * what the module OFFERS: the `.feature` declares that (operator ruling,
 * 2026-08-27). A field false here is a CAPTURE GAP against a declared preset,
 * reported loudly, never a button silently withdrawn.
 *
 * Shape unchanged from the contract already in `graphify-out/graph.json`
 * (community 446); only the meaning of `canErrorCollection` is corrected.
 */
export type CorpusCapabilities = {
  /** A successful collection read is recorded, so there are rows to remove. */
  canEmpty: boolean;
  /** Any recording exists at all — a withheld answer needs no body. */
  canLoading: boolean;
  /** A REFUSAL is recorded, so a failed read is served from a real response. */
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
