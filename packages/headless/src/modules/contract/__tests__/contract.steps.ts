// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.steps
 * @description The module's ONE step catalog — what drives the colocated
 * `contract.feature`. Engine-free by construction: it imports `defineSteps`
 * and `World` and nothing else, so the same catalog can be re-registered
 * against any runner.
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
 * `contract.feature` therefore reads `notYet` here, BY DESIGN and DOCUMENTED
 * — never spec-only by omission.
 *
 * PROVEN ELSEWHERE. `contract.mutations.int.test.ts` drives the real
 * `useContract()` writes (AC-6, AC-7, AC-8) against recorded staging
 * responses. `contract.utils.test.ts` (once authored against this module's
 * `*.utils.ts` public behaviour) pins the pure state derivation AC-12 and
 * AC-17 read back. Neither needs this catalog to be proof — the playback
 * registry and the executable suite are two independent proofs of the same
 * contract, and only one of them requires the `World` wiring this pass does
 * not have visibility into.
 */

import { defineSteps } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const CONTRACT_SCENARIO = "contract";

export const CONTRACT_COVERED_ACTIONS = {} as const;

export const coveredActionIds: readonly string[] = [];

// -----------------------------------------------------------------------------

/**
 * Zero steps registered — every `contract.feature` scenario sweeps to
 * `notYet` (see fileoverview). The call is kept, not deleted, so the module's
 * catalog file exists and the harness's per-module pairing finds it, per the
 * client-company.steps.ts exemplar's own shape.
 */
export const contractSteps = defineSteps(() => {
  // Intentionally empty — see fileoverview "SWEPT, IN FULL, THIS PASS".
});

export default contractSteps;
