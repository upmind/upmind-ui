/**
 * @fileoverview contract-product.utils unit tests
 *
 * ## Job To Be Done
 * Pin `selectStatusNode`'s full entry-order derivation for criterion @AC-17
 * ("Know what state each of my products is in") and @AC-15/AC-11's guard
 * inputs, per design.md §5.2 (`ContractProductState`), §8.7 and flow.md §3's
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
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { ContractProductsContextTypes } from "../contract-product.types";
import { ContractProductState } from "../contract-product.types";
import {
  resolveExcludeDelegated,
  selectStatusNode
} from "../contract-product.utils";
import type { ContractProduct } from "../contract-product.types";

type Fixture = Pick<
  ContractProduct,
  | "status"
  | "stagedImport"
  | "contractRequest"
  | "renew"
  | "isSubscription"
  | "calculatedCancelDate"
>;

/**
 * Every guard input `selectStatusNode` reads, defaulted to the "plain
 * active, nothing else in flight" case. Each `it` overrides only the guard
 * inputs its row's entry-order rule actually depends on — never the whole
 * object — so a passing row proves that ONE branch, not a coincidence of
 * defaults.
 */
function fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    status: { code: ContractStatusCodes.ACTIVE },
    stagedImport: false,
    contractRequest: undefined,
    renew: true,
    isSubscription: false,
    calculatedCancelDate: null,
    ...overrides
  };
}

describe("selectStatusNode — the raw status.code branch, one node per code (@AC-17)", () => {
  it.each([
    [ContractStatusCodes.PENDING, ContractProductState.PENDING],
    [ContractStatusCodes.AWAITING_ACTIVATION, ContractProductState.INACTIVE],
    [ContractStatusCodes.SUSPENDED, ContractProductState.SUSPENDED]
  ])("maps %s to %s", (code, expected) => {
    expect(selectStatusNode(fixture({ status: { code } }))).toBe(expected);
  });

  it("maps contract_fraud to unavailable.fraud — the one code no recorded fixture can carry (T03)", () => {
    expect(
      selectStatusNode(fixture({ status: { code: ContractStatusCodes.FRAUD } }))
    ).toBe(ContractProductState.FRAUD);
  });
});

describe("selectStatusNode — entry order on a shared contract_active code (flow.md §3, @AC-15/@AC-11)", () => {
  it("a plain active record with no request and no stopped renewal reads as ACTIVE", () => {
    expect(
      selectStatusNode(
        fixture({ status: { code: ContractStatusCodes.ACTIVE } })
      )
    ).toBe(ContractProductState.ACTIVE);
  });

  it("a contract_active record carrying a hard cancellation request reads as CANCELLING, tested BEFORE expiring or active — the record still says contract_active", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          contractRequest: {
            status: {
              code: CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
            }
          }
        })
      )
    ).toBe(ContractProductState.CANCELLING);
  });

  it("a contract_active subscription that stopped renewing, with a calculated end date, reads as EXPIRING — not the plain active the raw code alone would suggest", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          isSubscription: true,
          renew: false,
          calculatedCancelDate: "2026-12-31"
        })
      )
    ).toBe(ContractProductState.EXPIRING);
  });

  it("a one-off purchase that never renews at all is not read as EXPIRING — expiring needs a subscription, not just renew:false", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          isSubscription: false,
          renew: false,
          calculatedCancelDate: "2026-12-31"
        })
      )
    ).toBe(ContractProductState.ACTIVE);
  });

  it("cancelling still wins over expiring when both guard inputs are present on the same record", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          contractRequest: {
            status: {
              code: CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
            }
          },
          isSubscription: true,
          renew: false,
          calculatedCancelDate: "2026-12-31"
        })
      )
    ).toBe(ContractProductState.CANCELLING);
  });
});

describe("selectStatusNode — the record's own staged/cancelled/lapsed facts (@AC-11's read-only refusal, flow.md §3)", () => {
  it("a staged import reads as STAGED regardless of its status.code", () => {
    expect(
      selectStatusNode(
        fixture({
          status: { code: ContractStatusCodes.ACTIVE },
          stagedImport: true
        })
      )
    ).toBe(ContractProductState.STAGED);
  });

  it("maps contract_cancelled to unavailable.cancelled", () => {
    expect(
      selectStatusNode(
        fixture({ status: { code: ContractStatusCodes.CANCELLED } })
      )
    ).toBe(ContractProductState.CANCELLED);
  });

  it("maps contract_closed to unavailable.lapsed", () => {
    expect(
      selectStatusNode(
        fixture({ status: { code: ContractStatusCodes.CLOSED } })
      )
    ).toBe(ContractProductState.LAPSED);
  });
});

describe("selectStatusNode — an unknown status.code matches no node in ContractProductState (@AC-17)", () => {
  // `ContractProductState` has one member per published code (flow.md §3). A
  // code outside that vocabulary cannot select ANY of its members — the
  // selector returns no node, never a coerced default. AC-17's own promise,
  // "shown to me as it is, rather than quietly turned into one that is", is
  // the raw `status.code` reaching the manager's published state — proven at
  // the integration layer against the real record, not by this pure
  // selector, whose contract is "which enum member, if any" and never "the
  // raw code".
  it("a code outside the seven published codes selects no ContractProductState member", () => {
    const node = selectStatusNode(
      fixture({ status: { code: "not_a_real_code" as ContractStatusCodes } })
    );

    expect(node).not.toBe(ContractProductState.ACTIVE);
    expect(node).not.toBe(ContractProductState.PENDING);
    expect(node).toBeUndefined();
  });
});

/**
 * design.md §6.1/§8.5/§8.9, §"edge conditions" (@AC-18) — the exclude_delegated
 * flag `useContractProducts` sends. Named-scope-context tests are deliberately
 * excluded here per `contract-product.traceability.test.ts`'s `KNOWN_GAPS`
 * (AC-18 needs a `client-personal-details` preference-read capture that does
 * not exist on disk); this suite pins the PURE derivation only — the leaf that
 * decides the flag, with no fixture and no HTTP at all.
 */
describe("resolveExcludeDelegated — the exclude_delegated flag the scope sends (@AC-18)", () => {
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
});
