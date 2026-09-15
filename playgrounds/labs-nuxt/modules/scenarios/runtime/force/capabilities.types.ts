/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-27, re-queried) —
 * `CorpusCapabilities` (L28, community 446) and `corpusCapabilities()`
 * (`capabilities.ts` L75) are THIS module's own pair; no competing
 * corpus-capability contract exists in the tree (the only other `capability`
 * hits are `list-surface-capability-gate.spec` wrappers, an unrelated surface
 * concern). Nothing new is minted here — the recipe vocabulary stays
 * `states.types`' own `FORCE_RECIPES` / `ForceMeasuredRecipe` (which replaced
 * `useForcedState`'s retired `ForceUrlPreset` on 2026-09-12) and a recording
 * stays `corpus.source.types`' `RecordedFixture` (L30), both consumed whole.
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
   * The corpus can answer an absent read — a recorded collection whose ROWS come
   * out of its own envelope, or the module's own recorded read for a record that
   * is NOT THERE. Empty is not exclusively "a list with zero rows": a one-record
   * surface has an empty state too (operator ruling, 2026-08-28; no new type —
   * see the `graphify-out/` citation above).
   *
   * A member read carrying a record is NOT evidence: subtracting the record from
   * it produces a shape no API ever sends, which is authoring a body, and the
   * module's own mapper threw on the one that was written (S1). That absence is
   * a capture gap, reported by `captureGaps`.
   */
  canEmpty: boolean;
  /** Any recording exists at all — a withheld answer needs no body. */
  canLoading: boolean;
  /**
   * A SERVABLE refusal is recorded, so a failed read is served from a real
   * response. An auth refusal does not count: the app cannot tell a forced one
   * from an expired token and signs the operator out (FE-3113 P).
   */
  canErrorCollection: boolean;
  /** A FAILING WRITE is recorded. Nothing is authored to fake one. */
  canErrorAction: boolean;
  /**
   * The module's own failing recording, the one both error presets are served
   * from. Absent when the corpus holds no servable failure — which is what makes
   * `canErrorCollection` false too.
   */
  failure?: RecordedFixture;
  /**
   * The failing WRITE itself, unmixed with a read's refusal — what
   * `canErrorAction` is measured on, and the recording whose SENTENCE an armed
   * `error-action` marks a row with. Separate from {@link failure} because that
   * one falls back to a read's refusal, and a sentence the API said about a
   * change does not become something it said about a read.
   *
   * @graphify-citation `graphify query "is there an existing contract or field
   * carrying a recorded write refusal fixture or a refusal sentence for a forced
   * row"` (2026-08-28, FE-3113 O) — the only matches are the test lane's own
   * `refusalSentences()` (`components/__tests__/forced-surface.harness.ts` L167)
   * and `refusalsOf()` (`force/__tests__/force-presets-all-modules.spec.ts`
   * L224), neither of which app runtime may consume. Nothing is minted: this is
   * a field on the contract already in `graphify-out/graph.json` (community
   * 446), carrying the `RecordedFixture` (L30) the rest of the file carries.
   * See `graphify-out/GRAPH_REPORT.md`.
   */
  refusedWrite?: RecordedFixture;
};
