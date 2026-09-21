// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `contract-product.feature`. Engine-free by construction: it imports
 * `defineSteps` and `World` and nothing else, so the same catalog can be
 * re-registered against any runner.
 *
 * ADR-020 Amendment 5 (operator ruling 2026-09-12): tests are tests,
 * scenarios are scenarios — not every scenario is a replayable TRACK. A
 * scenario is a playable track only when a real step drives every one of its
 * lines; a do-nothing handler or one whose outcome needs wiring that does not
 * exist is FAKE and earns NO catalog entry.
 *
 * SWEPT, IN FULL, THIS PASS. Driving a scenario means registering it against
 * this module's `World` — the scenario-harness action-id/context surface a
 * consuming playground wires up. That wiring is not among the prover seat's
 * contract-fed inputs (design.md, the Gherkin, parity.yaml, the exported
 * `*.types.ts` surface — §3.9); authoring `world.fire(actionId, …)` calls
 * against an unverified action-id surface would be a catalog entry this seat
 * cannot confirm actually drives the module, which is the exact "fake
 * driven scenario" Amendment 5 exists to keep out. Every scenario in
 * `contract-product.feature` therefore reads `notYet` here, BY DESIGN and
 * DOCUMENTED — never spec-only by omission.
 *
 * PROVEN ELSEWHERE. `contract-product.mutations.int.test.ts` drives the real
 * `useContractProduct()` writes (AC-5, AC-9, AC-22, AC-23) against recorded
 * staging responses. `contract-product.utils.test.ts` pins the pure entry-order
 * state derivation AC-17/AC-15/AC-11 read back. Neither needs this catalog to
 * be proof — the playback registry and the executable suite are two
 * independent proofs of the same contract, and only one of them requires the
 * `World` wiring this pass does not have visibility into.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const CONTRACT_PRODUCT_SCENARIO = "contract_product";

export const CONTRACT_PRODUCT_COVERED_ACTIONS = {} as const;

export const coveredActionIds: readonly string[] = [];

// -----------------------------------------------------------------------------

/**
 * Zero steps registered — every `contract-product.feature` scenario sweeps to
 * `notYet` (see fileoverview). The call is kept, not deleted, so the module's
 * catalog file exists and the harness's per-module pairing finds it, per the
 * client-company.steps.ts exemplar's own shape.
 */
export const contractProductSteps = defineSteps(() => {
  // Intentionally empty — see fileoverview "SWEPT, IN FULL, THIS PASS".
});

export default contractProductSteps;
