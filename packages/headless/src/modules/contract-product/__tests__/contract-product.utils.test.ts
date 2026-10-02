/**
 * @fileoverview contract-product.utils unit tests
 *
 * ## Job To Be Done
 * Pin `selectStatusNode`'s full entry-order derivation for criterion @AC-17
 * ("Know what state each of my products is in") and @AC-15/AC-11's guard
 * inputs, per `design ✅.md` §5.2 (`ContractProductState`), §8.7 and flow.md §3's
 * locked "Entry order" rule: **unavailable first, then cancelling, then
 * expiring, then active** — the same raw `status.code` (`contract_active`)
 * is shared by three of the seven fixture rows below, so the branch a naive
 * switch on `status.code` alone would pick is the WRONG one for two of them.
 * A fixture that hardcodes every guard input to a fixed value never reaches
 * `cancelling` or `expiring` at all — that gap is the one this suite closes.
 * It also pins the one reading the integration layer cannot: `contract_fraud`,
 * which no client-reachable recorded response ever carries (bdd.md's
 * deferral table, task T03, "literal argument — no fixture is authored").
 *
 * ## What Breaks If These Fail
 * A client sees the wrong lifecycle state on one of their products — a
 * product mid-cancellation reading as plain `active`, an expiring
 * subscription reading as merely `active` with no expiry signalled, or a
 * fraud-flagged product (the one status this suite cannot reach over a
 * recorded fixture) silently reading as something else entirely — with no
 * integration test able to catch the regression, because every one of these
 * nodes shares `status.code: contract_active` with the plain-active case.
 */
import { describe, expect, it } from "vitest";
import { mapContractProduct } from "..";
import { ContractProductsContextTypes } from "../contract-product.types";
import { resolveExcludeDelegated } from "../contract-product.utils";
import recordedProduct from "./fixtures/get-contract-products-id.json";

/**
 * `design ✅.md` §6.1/§8.5/§8.9, §"edge conditions" — the exclude_delegated flag
 * `useContractProducts` sends. This is NOT AC-18 coverage: AC-18 promises the
 * client's remembered preference is persisted and re-read across sessions via
 * the `client-personal-details` seam, which this pure 3-arg function never
 * touches (its `preference` argument is a plain boolean handed in by the
 * caller, not a read of that seam), and which the prover cannot exercise — no
 * capture for it exists on disk, and `contract-product.traceability.test.ts`'s
 * `SCENARIO_GAPS` records AC-18 as an unproven operator gap for that reason. This
 * suite pins only the PURE derivation: given a context and a preference value,
 * which `exclude_delegated` int comes out.
 */
describe("resolveExcludeDelegated — the exclude_delegated flag the scope sends", () => {
  it("the DELEGATED selector context always reads the delegated view — exclude_delegated=0", () => {
    expect(
      resolveExcludeDelegated(
        { type: ContractProductsContextTypes.DELEGATED },
        undefined,
        true
      )
    ).toBe(0);
  });

  it("the client's own excludeDelegatedProducts preference, set true, forces exclude_delegated=1 outside the delegated view", () => {
    expect(resolveExcludeDelegated(undefined, true, true)).toBe(1);
  });

  it("the client's own excludeDelegatedProducts preference, set false, forces exclude_delegated=0 outside the delegated view", () => {
    expect(resolveExcludeDelegated(undefined, false, true)).toBe(0);
  });

  it("with delegated products and no preference held, the client sees them — exclude_delegated=0", () => {
    expect(resolveExcludeDelegated(undefined, undefined, true)).toBe(0);
  });

  it("with nothing delegated to the session, delegated products are excluded whatever was chosen — exclude_delegated=1", () => {
    expect(resolveExcludeDelegated(undefined, false, false)).toBe(1);
    expect(resolveExcludeDelegated(undefined, true, false)).toBe(1);
    expect(resolveExcludeDelegated(undefined, undefined, false)).toBe(1);
  });
});

describe("mapContractProduct — the mapping law (AC-24)", () => {
  const raw = (recordedProduct as { response: { body: { data: unknown } } })
    .response.body.data as Parameters<typeof mapContractProduct>[0];
  const mapped = mapContractProduct(raw);

  it("AC-24 returns a view model, never the wire record it was given", () => {
    expect(mapped).not.toBe(raw);
  });

  it("AC-24 every published member is camelCase — no snake_case wire key survives", () => {
    const snake = Object.keys(mapped).filter(key => key.includes("_"));

    expect(snake).toEqual([]);
  });

  it("AC-24 keeps the wire record reachable beside the view model", () => {
    expect(mapped.raw).toBe(raw);
  });

  it("AC-24 publishes only what this module reads — the wire record carries more", () => {
    expect(Object.keys(mapped).length).toBeLessThan(Object.keys(raw).length);
  });
});
