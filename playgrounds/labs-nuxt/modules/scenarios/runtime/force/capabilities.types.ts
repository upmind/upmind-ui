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
 * corpus — a `request.method` and a `response.status` — and it is what the
 * module OFFERS: a preset is offered when the corpus can ANSWER it (operator
 * ruling, 2026-08-27, revised). Reading the offer out of the `.feature`'s prose
 * instead is what left three modules with no affordance at all while their
 * states answered correctly.
 *
 * A false field is not always a debt. `canEmpty` false means the surface has
 * nothing recorded to take away at all; only an unrecorded REFUSAL is a capture
 * gap, which `captureGaps` reports.
 *
 * @graphify-citation `graphify query "CorpusCapabilities canEmpty empty state
 * single record"` (2026-08-28, FE-3113 K4) — the widened `canEmpty` meaning
 * mints no type: this contract and its four booleans are already in
 * `graphify-out/graph.json` (community 446), and the tree carries no rival
 * empty-state contract to consume. See `graphify-out/GRAPH_REPORT.md`.
 *
 * Shape unchanged from the contract already in `graphify-out/graph.json`
 * (community 446).
 */
export type CorpusCapabilities = {
  /**
   * A successful read carrying something to SUBTRACT is recorded — a
   * collection's rows, or a single record. Empty is not exclusively "a list
   * with zero rows": a one-record surface has an empty state too, and it is
   * that record withheld (operator ruling, 2026-08-28; no new type — see the
   * `graphify-out/` citation above).
   */
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
