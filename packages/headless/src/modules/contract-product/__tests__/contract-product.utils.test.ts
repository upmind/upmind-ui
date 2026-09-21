/**
 * @fileoverview contracts.mappers unit tests
 *
 * ## Job To Be Done
 * Pin the raw `status.code` branch of the contract-product status derivation
 * that criterion @AC-17 ("Know what state each of my products is in") reads
 * back, per design.md §5.2 (`ContractProductState`) and §8.7. It also pins
 * the one reading the integration layer cannot: `contract_fraud`, which no
 * client-reachable recorded response ever carries (bdd.md's deferral table,
 * task T03, "literal argument — no fixture is authored").
 *
 * ## What Breaks If These Fail
 * A client sees the wrong lifecycle state on one of their products — for
 * example a cancelled product reading as active — or a fraud-flagged product
 * (the one status this suite cannot reach over a recorded fixture) silently
 * reading as something else entirely, with no integration test able to catch
 * the regression.
 */
import { describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { selectStatusNode } from "../contract-products.mappers";
import { ContractProductState } from "../contract-products.types";

describe("selectStatusNode — the raw status.code branch (@AC-17)", () => {
  it.each([
    [ContractStatusCodes.PENDING, ContractProductState.PENDING],
    [ContractStatusCodes.AWAITING_ACTIVATION, ContractProductState.INACTIVE],
    [ContractStatusCodes.ACTIVE, ContractProductState.ACTIVE],
    [ContractStatusCodes.SUSPENDED, ContractProductState.SUSPENDED],
    [ContractStatusCodes.CANCELLED, ContractProductState.CANCELLED],
    [ContractStatusCodes.CLOSED, ContractProductState.LAPSED]
  ])("maps %s to %s", (code, expected) => {
    expect(selectStatusNode({ status: { code } } as never)).toBe(expected);
  });

  it("maps contract_fraud to unavailable.fraud — the one code no recorded fixture can carry (T03)", () => {
    expect(
      selectStatusNode({ status: { code: ContractStatusCodes.FRAUD } } as never)
    ).toBe(ContractProductState.FRAUD);
  });
});
