/**
 * @fileoverview contract-product.utils unit tests
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
import { ContractProductState } from "../contract-product.types";
import { selectStatusNode } from "../contract-product.utils";
import type { ContractProduct } from "../contract-product.types";

function fixture(
  code: ContractStatusCodes
): Pick<
  ContractProduct,
  | "status"
  | "stagedImport"
  | "contractRequest"
  | "renew"
  | "isSubscription"
  | "calculatedCancelDate"
> {
  return {
    status: { code },
    stagedImport: false,
    contractRequest: undefined,
    renew: true,
    isSubscription: false,
    calculatedCancelDate: null
  };
}

describe("selectStatusNode — the raw status.code branch (@AC-17)", () => {
  it.each([
    [ContractStatusCodes.PENDING, ContractProductState.PENDING],
    [ContractStatusCodes.AWAITING_ACTIVATION, ContractProductState.INACTIVE],
    [ContractStatusCodes.ACTIVE, ContractProductState.ACTIVE],
    [ContractStatusCodes.SUSPENDED, ContractProductState.SUSPENDED],
    [ContractStatusCodes.CANCELLED, ContractProductState.CANCELLED],
    [ContractStatusCodes.CLOSED, ContractProductState.LAPSED]
  ])("maps %s to %s", (code, expected) => {
    expect(selectStatusNode(fixture(code))).toBe(expected);
  });

  it("maps contract_fraud to unavailable.fraud — the one code no recorded fixture can carry (T03)", () => {
    expect(selectStatusNode(fixture(ContractStatusCodes.FRAUD))).toBe(
      ContractProductState.FRAUD
    );
  });
});
